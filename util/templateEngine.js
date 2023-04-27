import fs from "fs";

function renderPage(page, config={}) {
    const navbarPage = fs.readFileSync("./public/components/nav/nav.html", "utf-8")
       .replace("$TAB_TITLE", config.tabTitle || "tab default title");
    const loginPage = fs.readFileSync("./public/components/login/login.html");
    const footerPage = fs.readFileSync("./public/components/footer/footer.html");
 
    return navbarPage + loginPage + page + footerPage;
}

function readPage(pagePath) {
    return fs.readFileSync(pagePath, "utf-8");
}

export default {
    readPage,
    renderPage   
}