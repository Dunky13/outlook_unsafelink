// Inspired by: https://techcommunity.microsoft.com/t5/Outlook/Advanced-Threat-Protection-ATP-is-ruining-Outlook-com/m-p/176534/highlight/true#M1632
// -- https://1drv.ms/u/s!AL3JpMLcNI_DlrV7
function replaceUrls() {
  var urls = [...document.getElementsByTagName('a')].filter(x => x.href.indexOf('safelinks.protection.outlook.com') > 0)
  for (var i = 0, l = urls.length; i < l; i++) {
    var orgURL=urls[i].href;
    var href_dec = decodeURIComponent(urls[i].href);
    urls[i].href = href_dec.substring(href_dec.indexOf("?url=")+5,href_dec.indexOf("&data="));
    urls[i].title="Outlook Unmangled from: "+orgURL;
    if(urls[i].innerText.indexOf('safelinks.protection.outlook.com') > 0) {
      var inner_dec = decodeURIComponent(urls[i].innerText);
      urls[i].innerText = inner_dec.substring(inner_dec.indexOf("?url=")+5,inner_dec.indexOf("&data="));
    }
  }
  setTimeout(replaceUrls, 150);
}
replaceUrls();
