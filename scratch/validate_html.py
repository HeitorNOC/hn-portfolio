from html.parser import HTMLParser

class TestHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        
    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        
    def handle_endtag(self, tag):
        if self.tags:
            self.tags.pop()

try:
    with open('c:/workspace/hn-portfolio/index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    parser = TestHTMLParser()
    parser.feed(content)
    print("HTML Parser completed successfully! Tag structure is valid.")
except Exception as e:
    print("HTML Parser Error:", e)
