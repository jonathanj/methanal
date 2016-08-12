from nevow import tags
from xmantissa import webtheme


class Theme(webtheme.XHTMLDirectoryTheme):
    def head(self, request, website):
        def styleSheetLink(href):
            return tags.link(rel='stylesheet', type='text/css', href=href)
        root = website.rootURL(request)
        styles = root.child('static').child('Methanal').child('styles')
        yield styleSheetLink(styles.child('methanal.css'))
        yield styleSheetLink(styles.child('methanal-webfont.css'))
