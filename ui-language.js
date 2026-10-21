'use strict';
// UI translation is separate from book text, imported metadata and dictionary results.
const UI_TRANSLATIONS = {
 '阅间':'Yomori', '阅':'Y', 'TXT / EPUB 阅读器':'TXT / EPUB reader',
 '本地书架':'Local library', '使用说明':'Help', '阅间首页':'Yomori home',
 '继续阅读 →':'Continue →', '导入书籍':'Import books', '接着读':'Continue reading', '我的书架':'My library',
 '查找书名或作者':'Search title or author', '未找到书籍':'No books found',
 '书籍与进度仅保存在当前浏览器':'Books and progress are stored in this browser',
 '阅读设置':'Reading settings', '打开章节目录':'Open table of contents',
 '正文，轻点隐藏或显示控制栏':'Book text; tap empty space to show or hide controls',
 '全书阅读进度':'Book progress', '自动保存':'Auto-save', '阅读控制':'Reading controls',
 '上一章':'Previous', '下一章':'Next', '目录':'Contents', '返回书架':'Library',
 '关闭释义':'Close definition', '关闭目录':'Close contents', '关闭':'Close',
 '字号':'Font size', '行距':'Line spacing', '左右留白':'Side margins', '段间距':'Paragraph spacing',
 '首行缩进':'First-line indent', '不缩进':'None', '缩进两字':'Two characters',
 '点击英文单词查义':'Tap English words to look them up', '字体':'Font',
 '宋体':'Serif', '黑体':'Sans serif', '阅读背景':'Reading background',
 '纸白':'Paper', '暖黄':'Sepia', '浅绿':'Sage', '夜间':'Dark',
 '纸白背景':'Paper background', '暖黄背景':'Sepia background', '浅绿背景':'Sage background', '夜间背景':'Dark background',
 '导入 TXT':'Import TXT', '取消导入':'Cancel import', '字符编码':'Text encoding',
 '自动识别':'Auto-detect', 'Big5（繁体中文）':'Big5 (Traditional Chinese)',
 '正文预览':'Text preview', '取消':'Cancel', '确认导入':'Import',
 '移出书架？':'Remove this book?', '移除书籍':'Remove book', '移除':'Remove', '添加书籍':'Add book',
 '本设备上的阅读进度也会移除，原始文件不受影响。':'Reading progress on this device will also be removed. The original file is unchanged.',
 '分享 → 添加到主屏幕':'Share → Add to Home Screen',
 '在 iPhone 的':'On your iPhone, open this page in',
 '中打开此页面，点':'and choose', '，就能像 App 一样启动。':'. Launch it from the home screen.',
 '点「导入书籍」，从“文件”选择 TXT 或无 DRM 的 EPUB。TXT 支持 UTF-8、GB18030 / GBK、Big5、UTF-16；导入前可切换编码并预览。EPUB 保留正文与插图。':'Choose Import books and select a TXT or DRM-free EPUB file. TXT supports UTF-8, GB18030 / GBK, Big5 and UTF-16, with an encoding preview before import. EPUB retains text and illustrations.',
 '英文查词':'Word lookup',
 '点击正文中的英文单词查看中文翻译和英文释义，可在阅读设置中关闭。首次查词需要联网，仅向 MyMemory 和 Free Dictionary API 发送所点单词；已查到的结果会缓存在本机。中文翻译仅供参考。':'Tap an English word in the book to see a Chinese translation and English definitions. Disable this in reading settings if desired. New lookups require internet and send only the selected word to MyMemory and Free Dictionary API. Successful results are cached locally. Translations are a reference, not a contextual interpretation.',
 '离线与保存':'Offline and storage',
 '联网打开并等到顶部显示「离线已就绪」，之后可尝试离线打开。书籍和进度保存在此设备的浏览器中；不同设备不会同步。清除网站数据或系统回收存储可能使书籍丢失，请保留原文件。':'Open the app online and wait for Offline ready before trying it offline. Books and progress are stored in this browser and do not sync between devices. Clearing website data or browser storage eviction can remove them. Keep your original book files.',
 '首次访问或登录验证需要网络。当前托管环境的离线启动仍需在你的 iPhone 上确认。':'The first visit and any host authentication require internet. Offline launch must be checked on the target device and host.',
 '进度已备份':'Progress backed up', '进度已保存':'Progress saved',
 '数据库暂不可用，已保存至本地备份':'Database unavailable; saved to the local backup',
 '浏览器存储配额不足，进度保存失败':'Browser storage quota exceeded; progress could not be saved',
 '浏览器禁止本地存储，进度保存失败':'Browser storage access is blocked; progress could not be saved',
 '离线已就绪':'Offline ready', '离线缓存未启用':'Offline cache unavailable',
 '已移出书架':'Book removed', '移除失败，请重试':'Could not remove the book. Try again.',
 '查询中…':'Looking up…', '仅查询所选单词':'Only the selected word is sent',
 '中文翻译查询中…':'Loading Chinese translation…', '中文翻译暂不可用':'Chinese translation unavailable',
 '英文释义查询中…':'Loading English definitions…',
 '未查到英文释义，或词典暂不可用。':'No English definition found, or the dictionary is unavailable.',
 '暂未查到释义，请检查网络或稍后再试。人名、地名和虚构词可能没有词条。':'No definition available. Check your connection or try again later. Names and fictional terms may not have dictionary entries.',
 '查词失败，请稍后重试。':'Lookup failed. Try again later.', '重试':'Retry',
 '本机缓存 · 中文翻译：MyMemory（参考） · 英文：Free Dictionary API':'Cached · Chinese: MyMemory (reference) · English: Free Dictionary API',
 '中文翻译：MyMemory（参考） · 英文：Free Dictionary API':'Chinese: MyMemory (reference) · English: Free Dictionary API',
 '（空文件）':'(Empty file)', 'Language':'语言',
 '找不到书籍':'Book not found', '文件中没有可读正文':'The file has no readable text',
 '未找到可阅读的章节':'No readable chapters found', '不是有效的 EPUB':'Invalid EPUB file',
 'EPUB 缺少书籍目录':'EPUB package document not found', 'EPUB 目录格式无效':'Invalid EPUB package XML',
 '正文过大，暂不支持':'The book text is too large', '请使用小于 60 MB 的文件':'Please use a file smaller than 60 MB',
 '仅支持 TXT 和 EPUB':'Only TXT and EPUB files are supported', '此 EPUB 含加密内容，暂不支持':'Encrypted EPUB files are not supported'
};
const UI_SKIP = '#readingContent,#txtPreview,#txtFileName,#readerTitle,#tocBookTitle,#tocList,#deleteText,#wordTitle,#wordPhonetic,.book-title,.cover-title,.mini-cover,.continue-info strong,.word-chinese,.word-sense,[data-no-i18n]';
const uiTextSources = new WeakMap(), uiAttributeSources = new WeakMap();
let uiLanguage = 'en';
try { const saved = localStorage.getItem('yomori-language'); if (['en','zh-CN'].includes(saved)) uiLanguage = saved; } catch {}
function translateUI(source) {
 if (uiLanguage !== 'en') return source === 'Language' ? '语言' : source;
 if (source === 'Language') return 'Language';
 const trimmed = source.trim();
 if (Object.hasOwn(UI_TRANSLATIONS, trimmed)) return source.replace(trimmed, UI_TRANSLATIONS[trimmed]);
 let result = source;
 const replacements = [
  [/^第 (\d+) 节 · 已读 (\d+)%$/, 'Section $1 · $2% read'],
  [/^阅读 (.+)$/, 'Read $1'], [/^移除 (.+)$/, 'Remove $1'],
  [/^(.+)封面$/, '$1 cover'], [/^进度保存失败（(.+)）$/, 'Progress could not be saved ($1)'],
  [/^保存失败 · (.+)$/, 'Save failed · $1'], [/^打开失败：/, 'Could not open book: '],
  [/^本地存储不可用：/, 'Local storage unavailable: '], [/^正在导入 /, 'Importing '],
  [/^已导入《(.+)》$/, 'Imported "$1"'], [/^自动识别：(.+)；如有乱码，请切换编码。$/, 'Detected: $1. If the preview is garbled, choose another encoding.'],
  [/^编码：/, 'Encoding: '], [/^无法按此编码读取：/, 'Could not decode this encoding: '],
  [/ 倍字号$/, ' × font size'], [/ · 未读$/, ' · Unread'], [/ · 阅间$/, ' · Yomori'], [/^未知作者(?= ·|$)/, 'Unknown author'],
  [/^本地导入(?= ·|$)/, 'Imported file']
 ];
 for (const [pattern, replacement] of replacements) result = result.replace(pattern, replacement);
 for (const [original, translated] of Object.entries(UI_TRANSLATIONS)) { if (original.length > 5) result = result.split(original).join(translated); }
 return result;
}
function localizeTextNode(node) {
 if (node.parentElement?.closest(UI_SKIP) || node.parentElement?.closest('script,style,option')) return;
 let state = uiTextSources.get(node);
 if (!state || node.data !== state.rendered) state = {source: node.data, rendered: node.data};
 const rendered = translateUI(state.source);
 state.rendered = rendered; uiTextSources.set(node, state);
 if (node.data !== rendered) node.data = rendered;
}
function localizeElement(element) {
 if (element.closest(UI_SKIP)) return;
 let states = uiAttributeSources.get(element);
 if (!states) { states = {}; uiAttributeSources.set(element, states); }
 for (const attribute of ['aria-label','placeholder','title']) {
  if (!element.hasAttribute(attribute)) continue;
  const value = element.getAttribute(attribute);
  let state = states[attribute];
  if (!state || value !== state.rendered) state = {source:value, rendered:value};
  state.rendered = translateUI(state.source); states[attribute] = state;
  if (value !== state.rendered) element.setAttribute(attribute, state.rendered);
 }
}
function localizeUI(root) {
 if (root.nodeType === Node.TEXT_NODE) { localizeTextNode(root); return; }
 if (root.nodeType !== Node.ELEMENT_NODE || root.closest(UI_SKIP) || root.matches('script,style')) return;
 localizeElement(root);
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
  acceptNode(node) { return node.nodeType === Node.ELEMENT_NODE && (node.matches('script,style') || node.closest(UI_SKIP)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
 });
 let node;
 while (node = walker.nextNode()) { if (node.nodeType === Node.TEXT_NODE) localizeTextNode(node); else localizeElement(node); }
}
function setUILanguage(language) {
 uiLanguage = language === 'zh-CN' ? 'zh-CN' : 'en';
 try { localStorage.setItem('yomori-language', uiLanguage); } catch {}
 document.documentElement.lang = uiLanguage;
 document.getElementById('readingContent').setAttribute('aria-label', translateUI('正文，轻点隐藏或显示控制栏'));
 document.title = uiLanguage === 'en' ? 'Yomori' : '阅间';
 document.getElementById('uiLanguage').value = uiLanguage;
 localizeUI(document.body);
}
document.getElementById('uiLanguage').addEventListener('change', event => setUILanguage(event.target.value));
setUILanguage(uiLanguage);
new MutationObserver(records => {
 for (const record of records) {
  if (record.type === 'characterData') localizeTextNode(record.target);
  else if (record.type === 'attributes') localizeElement(record.target);
  else for (const node of record.addedNodes) localizeUI(node);
 }
}).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['aria-label','placeholder','title']});
