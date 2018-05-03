function replaceUrls() {
  var urls = [...document.getElementsByTagName('a')].filter(x => x.href.indexOf('safelinks.protection.outlook.com') > 0)
  for (var i = 0, l = urls.length; i < l; i++) {
    var href_dec = decodeURIComponent(urls[i].href);
    urls[i].href = href_dec.substring(href_dec.indexOf("?url=")+5,href_dec.indexOf("&data="));
    if(urls[i].innerText.indexOf('safelinks.protection.outlook.com') > 0) {
      var inner_dec = decodeURIComponent(urls[i].innerText);
      urls[i].innerText = inner_dec.substring(inner_dec.indexOf("?url=")+5,inner_dec.indexOf("&data="));
    }
  }
  setTimeout(replaceUrls, 150);
}
replaceUrls();
