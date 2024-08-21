import puppeteer from 'puppeteer';
import fs from 'fs';

const saveProductDataInFile = async (page) => {
    const priceDiv = await page.$('.PriceInfo_root__GX9Xp');
    const productData = await page.evaluate((priceDiv) => {
        const rating = document.querySelector('.ActionsRow_stars__EKt42')?.textContent || "0";
        const reviewCount = document.querySelector('.ActionsRow_reviews__AfSj_')?.textContent || "0";
        if (priceDiv.querySelector(".Price_role_discount__l_tpE")) {
            const price = priceDiv.querySelector('.Price_role_discount__l_tpE')?.textContent || "0";

            const priceOld = priceDiv.querySelector('.Price_role_old__r1uT1')?.textContent || "0";

            return [
                `price=${parseFloat(price
                    .replace(",", ".")
                    .replace(/[^0-9.]+/g, ""))}`,
                `priceOld=${parseFloat(priceOld
                    .replace(",", ".")
                    .replace(/[^0-9.]+/g, ""))}`,
                `rating=${parseFloat(rating
                    .replace(/[^0-9.]+/g, ""))}`,
                `reviewCount=${Number(reviewCount
                    .replace(/[^0-9]+/g, ""))}`
            ].join('\n')
        } else {
            const price = priceDiv.querySelector('.Price_role_regular__X6X4D')?.textContent || "0";
            return [
                `price=${parseFloat(price
                    .replace(",", ".")
                    .replace(/[^0-9.]+/g, ""))}`,
                `rating=${parseFloat(rating
                    .replace(/[^0-9.]+/g, ""))}`,
                `reviewCount=${Number(reviewCount
                    .replace(/[^0-9]+/g, ""))}`
            ].join('\n')
        }
    }, priceDiv);

    fs.writeFileSync('product.txt', productData);
}

const scrollToBottom = async (page) => {
    await page.evaluate(async () => {
        // Фиксируем хедер
        const header = document.querySelector('.UiHeaderHorizontalBase_firstRow__iAQYq');
        if (header) {
            header.style["position"] = 'static';
            header.style["z-index"] = '3';
        }

        const distance = 100; // Расстояние прокрутки за раз
        const delay = 50; // Задержка между прокрутками, мс
        let totalHeight = 0;
        const scrollHeight = document.body.scrollHeight;

        while (totalHeight < scrollHeight) {
            totalHeight += distance;
            window.scrollBy(0, distance);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    });
};

const hideUselessElements = async (page) => {
    await page.evaluate(() => {
        const headerStickyPortal = document.querySelector('.StickyPortal_root__5NZsr');
        if (headerStickyPortal) {
            headerStickyPortal.style["display"] = "none"
        }
        const headerTooltipButton = document.querySelector('.Tooltip_closeIcon__skwl0');
        if (headerTooltipButton) {
            headerTooltipButton.click()
        }
    });
};

const checkRegion = async (page, regionName) => {
    // Сравниваем элементы html-списка с нужным названием, и формируем массив булеанов
    const booleanRegions = await page.$$eval('.UiRegionListBase_item___ly_A', (items, regionName) => {
        return items.map(item => regionName === item.textContent.trim());
    }, regionName);

    // Проверяем наличие совпадения среди элементов, и через !! возвращаем булеан
    return !!booleanRegions.filter(item => item === true).length;
}


async function main() {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            "--no-sandbox",
        ]
    });
    try {
        const url = process.argv[process.argv.length - 2]?.trim();
        const regionName = process.argv[process.argv.length - 1]?.trim();
        if (!url) {
            console.error("Error: Url not provided")
            return;
        }
        if (!regionName) {
            console.error("Error: Region not provided")
            return;
        }

        console.log("Processing...")
        const page = await browser.newPage();
        await page.setViewport({width: 1280, height: 720});

        await page.goto(url);
        await page.setCookie({
            name: 'isUserAgreeCookiesPolicy', value: 'true'
        });
        await page.reload();

        // Ждем проверку браузера
        await page.waitForSelector(".c1", {hidden: true, timeout: 10000})
        // Ждем загрузки контейнера с регионами, и открываем модалку
        await page.waitForSelector(".Region_regionIcon__oZ0Rt", {visible: true, timeout: 10000})
        await page.waitForResponse("https://www.vprok.ru/web/api/v1/regionList", {timeout: 10000});

        await page.locator(".Region_regionIcon__oZ0Rt").click();
        await page.waitForSelector(".UiRegionListBase_list__cH0fK", {visible: true, timeout: 10000});

        // Проверка на наличие региона в списке
        if (!await checkRegion(page, regionName)) {
            await browser.close();
            console.error(`Error: Region isn't on the site`)
            return;
        }
        // Выбор региона
        await page.locator(`text/${regionName}`).click();

        // Сохранение данных в файл после закрытия модалки
        await page.waitForSelector('.UiRegionListBase_list__cH0fK', {hidden: true, timeout: 10000});
        await saveProductDataInFile(page);

        await scrollToBottom(page); // Прокрутка до низа страницы для корректной отрисовки
        await hideUselessElements(page); // Скрытие лишних элементов для скриншота

        // Ждем полной загрузки изображения в футере, страница готова
        await page.waitForFunction(() => {
            const img = document.querySelector('img.UiFooterBottomBase_logo__wEbJo');
            return img && img.complete && img.naturalHeight !== 0;
        });

        await page.screenshot({
            path: "screenshot.jpg", fullPage: true
        });

        console.log("Done, check screenshot.jpg and product.txt files in project folder");
    } catch (e) {
        console.error(e)
    }

    await browser.close();
}

await main()