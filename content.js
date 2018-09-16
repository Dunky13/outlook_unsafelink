// Inspired by: https://techcommunity.microsoft.com/t5/Outlook/Advanced-Threat-Protection-ATP-is-ruining-Outlook-com/m-p/176534/highlight/true#M1632
// -- https://1drv.ms/u/s!AL3JpMLcNI_DlrV7

function parseURL(url) {
	url_query = "url="
	url_index = url.indexOf(url_query)+url_query.length
	
	data_query = "&amp;data="
	data_index = url.indexOf(data_query)
	
	if(data_index == -1) {
		data_query = "&data="
		data_index = url.indexOf(data_query)
	}
	
	return url.substring(url_index, data_index);
}

function replaceUrls() {
  var urls = [...document.getElementsByTagName('a')].filter(x => x.href.indexOf('safelinks.protection.outlook.com') > 0)
  for (var i = 0, l = urls.length; i < l; i++) {
    var orgURL=urls[i].href;
    var href_dec = decodeURIComponent(urls[i].href);
    urls[i].href = parseURL(href_dec);
    urls[i].title="Outlook Unmangled from: "+orgURL;
    if(urls[i].innerText.indexOf('safelinks.protection.outlook.com') > 0) {
      var inner_dec = decodeURIComponent(urls[i].innerText);
      urls[i].innerText = parseURL(inner_dec);
    }
  }
  setTimeout(replaceUrls, 150);
}
replaceUrls();
