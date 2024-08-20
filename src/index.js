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

    const url = process.argv[2];
    const regionName = process.argv[3];

    if (!url) {
        console.log("Url not provided, exit...")
        return;
    }
    if (!regionName) {
        console.log("Region not provided, exit...")
        return;
    }
    console.log(regionName)
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setViewport({width: 1280, height: 720});

    await page.goto(url);
    await page.setCookie({
        name: 'isUserAgreeCookiesPolicy', value: 'true'
    });
    await page.reload();


    // https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202
    // https://www.vprok.ru/product/greenfield-greenf-chay-gold-ceyl-bl-pak-100h2g--307403

    await page.waitForSelector(".Region_regionIcon__oZ0Rt")

    await page.locator(".Region_regionIcon__oZ0Rt").click();

    await page.locator(".UiRegionListBase_list__cH0fK").waitHandle();
    // setTimeout(() => {}, 2000)
    const test = await page.$$eval('.UiRegionListBase_item___ly_A', (items) => {
        return items.map((item) => {
            return "Москва и область" === item.textContent.trim()
        });
    });

    console.log('Регионы:', await checkRegion(page, regionName));
    await page.locator("text/Санкт-Петербург и область").click();
    // setTimeout(() => {}, 1000)

    await page.waitForNavigation();

    await page.waitForFunction(() => {
        const img = document.querySelector('img.UiSharedPicture_image___6F3C');
        return img && img.complete && img.naturalHeight !== 0;
    });


    await scrollToBottom(page); // Прокрутка до низа страницы для корректной отрисовки
    await hideUselessElements(page); // Скрытие лишних элементов для скриншота

    await page.waitForFunction(() => {
        const img = document.querySelector('img.UiFooterBottomBase_logo__wEbJo');
        return img && img.complete && img.naturalHeight !== 0;
    });

    await page.screenshot({
        path: "screenshot.jpg", fullPage: true
    });

    console.log("Done");
    await browser.close();
}

await main();