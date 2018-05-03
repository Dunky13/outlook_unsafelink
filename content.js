var urls = document.getElementsByTagName('a');
for (var i = 0, l = urls.length; i < l; i++) {
  var dec = decodeURIComponent(urls[i].href);
  if (dec.indexOf('safelinks.protection.outlook.com') > 0) {
    urls[i].href = dec.substring(dec.indexOf("?url=")+5,dec.indexOf("&data="));
  }
  var dec = decodeURIComponent(urls[i].innerText);
  if (dec.indexOf('safelinks.protection.outlook.com') > 0) {
    urls[i].innerText = dec.substring(dec.indexOf("?url=")+5,dec.indexOf("&data="));
  }
}
