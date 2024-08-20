import puppeteer from 'puppeteer';


const scrollToBottom = async (page) => {
    await page.evaluate(async () => {
        // Фиксируем хедер
        const header = document.querySelector('.UiHeaderHorizontalBase_firstRow__iAQYq');
        if (header) {
            header.style["position"] = 'static';
            header.style["z-index"] = '3';
        }

        const distance = 100; // Расстояние прокрутки за раз
        const delay = 100; // Задержка между прокрутками, мс
        let totalHeight = 0;
        const innerHeight = window.innerHeight;
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
    try {
        const url = process.argv[2].trim();
        const regionName = process.argv[3].trim();

        if (!url) {
            throw new Error("Url not provided")
        }
        if (!regionName) {
            throw new Error("Region not provided")
        }


        const browser = await puppeteer.launch(
            {
                headless: false,
            });
        const page = await browser.newPage();
        await page.setViewport({width: 1280, height: 720});

        await page.goto(url);
        await page.setCookie({
            name: 'isUserAgreeCookiesPolicy', value: 'true'
        });
        await page.reload();

        // Ждем загрузки контейнера с регионами, и открываем модалку
        await page.waitForSelector(".Region_regionIcon__oZ0Rt", {timeout: 10000})
        await page.locator(".Region_regionIcon__oZ0Rt").click();
        await page.waitForSelector(".UiRegionListBase_list__cH0fK", {timeout: 10000});

        // Проверка на наличие региона в списке
        if (!await checkRegion(page, regionName)) {
            await browser.close();
            throw new Error(`Region ${regionName} isn't on the site`)
        }
        await page.locator(`text/${regionName}`).click();

        // Ждем полной загрузки изображения товара
        await page.waitForFunction(() => {
            const img = document.querySelector('img.UiSharedPicture_image___6F3C');
            return img && img.complete && img.naturalHeight !== 0;
        });


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

        console.log("Done");
        await browser.close();
    } catch (e) {
        console.error(e)
        return;
    }
}

await main();