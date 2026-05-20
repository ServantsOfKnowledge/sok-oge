const PAGE_SIZE = 25;
const summaryUrl = "./data/summary.json";
const latestUrl = "./data/latest.json.gz";

const LOCALES = {
  "en": {
    "code": "en-IN",
    "title": "Official Gazette Explorer",
    "eyebrow": "Servants of Knowledge",
    "lede": "Search indexed gazette metadata from the completed archive export. The GitHub Pages edition loads publication data on demand, so state-scoped browsing stays fast while the full archive remains available.",
    "languageLabel": "Interface language",
    "statRecords": "Indexed records",
    "statStates": "States and UTs",
    "statPublications": "Publications",
    "statesHeading": "States",
    "clear": "Clear",
    "queryLabel": "Search text",
    "queryPlaceholder": "Department, subject, gazette number, notification number",
    "stateLabel": "State",
    "publicationLabel": "Publication",
    "dateFromLabel": "From date",
    "dateToLabel": "To date",
    "searchButton": "Search archive",
    "resetButton": "Reset",
    "latestButton": "Show latest",
    "hint": "Tip: state or publication filters load much faster. Global search across all publications still works, but it may take longer because the GitHub Pages version fetches shards directly in the browser.",
    "loadingSummary": "Loading summary…",
    "preparing": "Preparing the archive view.",
    "previous": "Previous",
    "next": "Next",
    "pageOf": "Page {page} of {totalPages}",
    "chatTitle": "Archive Assistant",
    "chatSubtitle": "Ask for help with filters, summaries, or what is visible in the current result set.",
    "clearChat": "Clear chat",
    "chatPlaceholder": "Try: find land acquisition in Karnataka",
    "ask": "Ask",
    "allStates": "All states",
    "allPublications": "All publications",
    "latestDescriptor": "Latest published gazettes",
    "matchingDescriptor": "Matching results",
    "noMatching": "No matching records",
    "noResultsBody": "No records matched the current filters. Try widening the date range, changing the state, or removing the search text.",
    "resultShowing": "Showing {start}-{end} of {total}",
    "statusLatest": "Showing the latest preloaded records. Use filters or search to scan the full archive.",
    "statusSearch": "Search complete across {count} matching records.",
    "statusLoadingShard": "Loading {current} of {total} publication shards for {label}…",
    "statusFiltering": "Filtering records…",
    "statusFailed": "The static archive request failed. Please try again.",
    "resultState": "State",
    "resultPublication": "Publication",
    "resultMetadataFile": "Metadata file",
    "resultRawFile": "Raw file",
    "linkPublication": "Publication",
    "linkXml": "XML file",
    "linkPdf": "PDF file",
    "linkRaw": "Raw file",
    "linkSource": "Open source",
    "unknownDate": "Unknown date",
    "undated": "Undated",
    "notification": "Notification {index}",
    "chatWelcome": "I can help you explore the archive. Ask for a state, a publication, the latest visible results, or search inside metadata.",
    "chatNoResults": "There are no matching records right now. Try widening the date range, clearing the state filter, or removing the search text.",
    "chatSummaryLine1": "There are {count} matching records in the current archive view.",
    "chatSummaryStates": "Top states in the first visible slice: {items}.",
    "chatSummaryPublications": "Top publications in the first visible slice: {items}.",
    "chatMetadataNone": "I searched the archive metadata for \"{query}\", but nothing matched the current filters.",
    "chatMetadataFound": "I searched the archive metadata for \"{query}\" and found {count} matching records.",
    "chatMetadataExamples": "A few examples are: {items}.",
    "chatReset": "The filters are cleared, and I switched the page back to the default latest-results view.",
    "chatLatest": "I switched back to the latest published gazettes view so you can browse the freshest records first.",
    "chatFilterApplied": "I applied the filter for {labels}. There are now {count} matching records.",
    "chatHelp": "I can help with a few archive tasks:\n- apply a state or publication filter when you name it\n- search inside archive metadata using plain-language queries\n- reset the current search\n- switch back to the latest records view\n- summarize the current result set",
    "chatFallback": "Try prompts like:\n- summarize current results\n- show Andhra Pradesh\n- find land acquisition in Karnataka\n- reset filters\n- show latest gazettes"
  },
  "kn": {
    "code": "kn-IN",
    "title": "ಅಧಿಕೃತ ಗಜೆಟ್ ಅನ್ವೇಷಕ",
    "eyebrow": "ಸರ್ವೆಂಟ್ಸ್ ಆಫ್ ನಾಲೆಡ್ಜ್",
    "lede": "ಪೂರ್ಣಗೊಂಡ ಆರ್ಕೈವ್ ರಫ್ತಿನಿಂದ ಸೂಚ್ಯಂಕಗೊಂಡ ಗಜೆಟ್ ಮೆಟಾಡೇಟಾವನ್ನು ಹುಡುಕಿ. GitHub Pages ಆವೃತ್ತಿ ಅಗತ್ಯವಿದ್ದಾಗ ಮಾತ್ರ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡುತ್ತದೆ.",
    "languageLabel": "ಇಂಟರ್‌ಫೇಸ್ ಭಾಷೆ",
    "statRecords": "ಸೂಚ್ಯಂಕಗೊಂಡ ದಾಖಲೆಗಳು",
    "statStates": "ರಾಜ್ಯಗಳು ಮತ್ತು ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶಗಳು",
    "statPublications": "ಪ್ರಕಟನೆಗಳು",
    "statesHeading": "ರಾಜ್ಯಗಳು",
    "clear": "ಅಳಿಸು",
    "queryLabel": "ಹುಡುಕಾಟ ಪಠ್ಯ",
    "queryPlaceholder": "ವಿಭಾಗ, ವಿಷಯ, ಗಜೆಟ್ ಸಂಖ್ಯೆ, ಅಧಿಸೂಚನೆ ಸಂಖ್ಯೆ",
    "stateLabel": "ರಾಜ್ಯ",
    "publicationLabel": "ಪ್ರಕಟನೆ",
    "dateFromLabel": "ಆರಂಭ ದಿನಾಂಕ",
    "dateToLabel": "ಅಂತಿಮ ದಿನಾಂಕ",
    "searchButton": "ಆರ್ಕೈವ್ ಹುಡುಕಿ",
    "resetButton": "ಮರುಹೊಂದಿಸು",
    "latestButton": "ಇತ್ತೀಚಿನವು ತೋರಿಸಿ",
    "hint": "ಸೂಚನೆ: ರಾಜ್ಯ ಅಥವಾ ಪ್ರಕಟಣಾ ಫಿಲ್ಟರ್‌ಗಳು ಹೆಚ್ಚು ವೇಗವಾಗಿರುತ್ತವೆ.",
    "loadingSummary": "ಸಾರಾಂಶ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    "preparing": "ಆರ್ಕೈವ್ ದೃಶ್ಯ ಸಿದ್ಧಗೊಳ್ಳುತ್ತಿದೆ.",
    "previous": "ಹಿಂದಿನದು",
    "next": "ಮುಂದಿನದು",
    "pageOf": "ಪುಟ {page} / {totalPages}",
    "chatTitle": "ಆರ್ಕೈವ್ ಸಹಾಯಕ",
    "chatSubtitle": "ಫಿಲ್ಟರ್‌ಗಳು, ಸಾರಾಂಶಗಳು ಅಥವಾ ಗೋಚರ ಫಲಿತಾಂಶಗಳ ಬಗ್ಗೆ ಕೇಳಿ.",
    "clearChat": "ಚಾಟ್ ಅಳಿಸು",
    "chatPlaceholder": "ಉದಾ: ಕರ್ನಾಟಕದಲ್ಲಿ ಭೂಸ್ವಾಧೀನ ಹುಡುಕಿ",
    "ask": "ಕೇಳಿ",
    "allStates": "ಎಲ್ಲಾ ರಾಜ್ಯಗಳು",
    "allPublications": "ಎಲ್ಲಾ ಪ್ರಕಟಣೆಗಳು",
    "latestDescriptor": "ಇತ್ತೀಚಿನ ಪ್ರಕಟಿತ ಗಜೆಟ್‌ಗಳು",
    "matchingDescriptor": "ಹೊಂದುವ ಫಲಿತಾಂಶಗಳು",
    "noMatching": "ಹೊಂದುವ ದಾಖಲೆಗಳಿಲ್ಲ",
    "noResultsBody": "ಪ್ರಸ್ತುತ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಹೊಂದುವ ದಾಖಲೆಗಳಿಲ್ಲ.",
    "resultShowing": "{start}-{end} / {total} ತೋರಿಸಲಾಗುತ್ತಿದೆ",
    "statusLatest": "ಇತ್ತೀಚಿನ ಪೂರ್ವಲೋಡ್ ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
    "statusSearch": "{count} ಹೊಂದುವ ದಾಖಲೆಗಳ ಮೇಲೆ ಹುಡುಕಾಟ ಪೂರ್ಣಗೊಂಡಿದೆ.",
    "statusLoadingShard": "{label}ಗಾಗಿ {current} / {total} ಪ್ರಕಟಣಾ ಶಾರ್ಡ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…",
    "statusFiltering": "ದಾಖಲೆಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಲಾಗುತ್ತಿದೆ…",
    "statusFailed": "ಸ್ಥಿರ ಆರ್ಕೈವ್ ವಿನಂತಿ ವಿಫಲವಾಗಿದೆ.",
    "resultState": "ರಾಜ್ಯ",
    "resultPublication": "ಪ್ರಕಟನೆ",
    "resultMetadataFile": "ಮೆಟಾಡೇಟಾ ಫೈಲ್",
    "resultRawFile": "ಮೂಲ ಫೈಲ್",
    "linkPublication": "ಪ್ರಕಟನೆ",
    "linkXml": "XML ಫೈಲ್",
    "linkPdf": "PDF ಫೈಲ್",
    "linkRaw": "ಮೂಲ ಫೈಲ್",
    "linkSource": "ಮೂಲ ತೆರೆ",
    "unknownDate": "ದಿನಾಂಕ ತಿಳಿದಿಲ್ಲ",
    "undated": "ದಿನಾಂಕವಿಲ್ಲ",
    "notification": "ಅಧಿಸೂಚನೆ {index}",
    "chatWelcome": "ನಾನು ಆರ್ಕೈವ್ ಅನ್ವೇಷಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ರಾಜ್ಯ, ಪ್ರಕಟಣೆ ಅಥವಾ ಮೆಟಾಡೇಟಾ ಹುಡುಕಾಟವನ್ನು ಕೇಳಿ.",
    "chatNoResults": "ಈಗ ಹೊಂದುವ ದಾಖಲೆಗಳಿಲ್ಲ.",
    "chatSummaryLine1": "ಪ್ರಸ್ತುತ ದೃಶ್ಯದಲ್ಲಿ {count} ಹೊಂದುವ ದಾಖಲೆಗಳಿವೆ.",
    "chatSummaryStates": "ಪ್ರಮುಖ ರಾಜ್ಯಗಳು: {items}.",
    "chatSummaryPublications": "ಪ್ರಮುಖ ಪ್ರಕಟಣೆಗಳು: {items}.",
    "chatMetadataNone": "\"{query}\"ಗಾಗಿ ಮೆಟಾಡೇಟಾದಲ್ಲಿ ಹೊಂದುವದೇನೂ ಸಿಗಲಿಲ್ಲ.",
    "chatMetadataFound": "\"{query}\"ಗಾಗಿ ಮೆಟಾಡೇಟಾದಲ್ಲಿ {count} ಹೊಂದುವ ದಾಖಲೆಗಳು ಸಿಕ್ಕಿವೆ.",
    "chatMetadataExamples": "ಕೆಲವು ಉದಾಹರಣೆಗಳು: {items}.",
    "chatReset": "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.",
    "chatLatest": "ಇತ್ತೀಚಿನ ಗಜೆಟ್ ದೃಶ್ಯಕ್ಕೆ ಮರಳಿದ್ದೇನೆ.",
    "chatFilterApplied": "{labels} ಫಿಲ್ಟರ್ ಅನ್ವಯಿಸಲಾಗಿದೆ. ಈಗ {count} ದಾಖಲೆಗಳಿವೆ.",
    "chatHelp": "ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n- ರಾಜ್ಯ ಅಥವಾ ಪ್ರಕಟಣೆ ಫಿಲ್ಟರ್\n- ಮೆಟಾಡೇಟಾ ಹುಡುಕಾಟ\n- ಮರುಹೊಂದಿಸು\n- ಇತ್ತೀಚಿನ ದೃಶ್ಯ\n- ಫಲಿತಾಂಶ ಸಾರಾಂಶ",
    "chatFallback": "ಇವುಗಳನ್ನು ಪ್ರಯತ್ನಿಸಿ:\n- ಪ್ರಸ್ತುತ ಫಲಿತಾಂಶಗಳ ಸಾರಾಂಶ\n- ಆಂಧ್ರ ಪ್ರದೇಶ ತೋರಿಸಿ\n- ಕರ್ನಾಟಕದಲ್ಲಿ ಭೂಸ್ವಾಧೀನ ಹುಡುಕಿ\n- ಮರುಹೊಂದಿಸು"
  },
  "hi": {
    "code": "hi-IN",
    "title": "आधिकारिक राजपत्र अन्वेषक",
    "eyebrow": "सर्वेंट्स ऑफ नॉलेज",
    "lede": "पूर्ण आर्काइव निर्यात से अनुक्रमित राजपत्र मेटाडेटा खोजें।",
    "languageLabel": "इंटरफ़ेस भाषा",
    "statRecords": "अनुक्रमित अभिलेख",
    "statStates": "राज्य और केंद्रशासित प्रदेश",
    "statPublications": "प्रकाशन",
    "statesHeading": "राज्य",
    "clear": "साफ़ करें",
    "queryLabel": "खोज पाठ",
    "queryPlaceholder": "विभाग, विषय, राजपत्र संख्या, अधिसूचना संख्या",
    "stateLabel": "राज्य",
    "publicationLabel": "प्रकाशन",
    "dateFromLabel": "आरंभ तिथि",
    "dateToLabel": "समाप्ति तिथि",
    "searchButton": "आर्काइव खोजें",
    "resetButton": "रीसेट",
    "latestButton": "नवीनतम दिखाएँ",
    "hint": "संकेत: राज्य या प्रकाशन फ़िल्टर तेज़ चलते हैं।",
    "loadingSummary": "सारांश लोड हो रहा है…",
    "preparing": "आर्काइव दृश्य तैयार हो रहा है।",
    "previous": "पिछला",
    "next": "अगला",
    "pageOf": "पृष्ठ {page} / {totalPages}",
    "chatTitle": "आर्काइव सहायक",
    "chatSubtitle": "फ़िल्टर, सारांश या वर्तमान परिणामों पर सहायता माँगें।",
    "clearChat": "चैट साफ़ करें",
    "chatPlaceholder": "उदाहरण: कर्नाटक में भूमि अधिग्रहण खोजें",
    "ask": "पूछें",
    "allStates": "सभी राज्य",
    "allPublications": "सभी प्रकाशन",
    "latestDescriptor": "नवीनतम प्रकाशित राजपत्र",
    "matchingDescriptor": "मिलते हुए परिणाम",
    "noMatching": "कोई मिलान नहीं",
    "noResultsBody": "वर्तमान फ़िल्टर के लिए कोई अभिलेख नहीं मिला।",
    "resultShowing": "{start}-{end} / {total} दिखाए जा रहे हैं",
    "statusLatest": "पूर्व-लोड किए गए नवीनतम अभिलेख दिखाए जा रहे हैं।",
    "statusSearch": "{count} मिलते हुए अभिलेखों पर खोज पूरी हुई।",
    "statusLoadingShard": "{label} के लिए {current} / {total} शार्ड लोड हो रहे हैं…",
    "statusFiltering": "अभिलेख फ़िल्टर किए जा रहे हैं…",
    "statusFailed": "स्थिर आर्काइव अनुरोध विफल हुआ।",
    "resultState": "राज्य",
    "resultPublication": "प्रकाशन",
    "resultMetadataFile": "मेटाडेटा फ़ाइल",
    "resultRawFile": "मूल फ़ाइल",
    "linkPublication": "प्रकाशन",
    "linkXml": "XML फ़ाइल",
    "linkPdf": "PDF फ़ाइल",
    "linkRaw": "मूल फ़ाइल",
    "linkSource": "स्रोत खोलें",
    "unknownDate": "तिथि अज्ञात",
    "undated": "बिना तिथि",
    "notification": "अधिसूचना {index}",
    "chatWelcome": "मैं आर्काइव समझने में मदद कर सकता हूँ। राज्य, प्रकाशन या मेटाडेटा खोज के बारे में पूछें।",
    "chatNoResults": "अभी कोई मिलते हुए अभिलेख नहीं हैं।",
    "chatSummaryLine1": "वर्तमान दृश्य में {count} मिलते हुए अभिलेख हैं।",
    "chatSummaryStates": "मुख्य राज्य: {items}.",
    "chatSummaryPublications": "मुख्य प्रकाशन: {items}.",
    "chatMetadataNone": "\"{query}\" के लिए कोई मेल नहीं मिला।",
    "chatMetadataFound": "\"{query}\" के लिए {count} मिलते हुए अभिलेख मिले।",
    "chatMetadataExamples": "कुछ उदाहरण: {items}.",
    "chatReset": "फ़िल्टर साफ़ कर दिए गए हैं।",
    "chatLatest": "मैं नवीनतम दृश्य पर लौट आया हूँ।",
    "chatFilterApplied": "{labels} फ़िल्टर लागू किया गया। अब {count} अभिलेख हैं।",
    "chatHelp": "मैं सहायता कर सकता हूँ:\n- राज्य या प्रकाशन फ़िल्टर\n- मेटाडेटा खोज\n- रीसेट\n- नवीनतम दृश्य\n- परिणाम सारांश",
    "chatFallback": "यह आज़माएँ:\n- वर्तमान परिणामों का सार दें\n- आंध्र प्रदेश दिखाएँ\n- कर्नाटक में भूमि अधिग्रहण खोजें\n- रीसेट"
  },
  "ta": {
    "code": "ta-IN",
    "title": "அதிகாரப்பூர்வ வர்த்தமானி ஆய்வி",
    "eyebrow": "சர்வன்ட்ஸ் ஆஃப் நோலெஜ்",
    "lede": "முழுமையான காப்பக ஏற்றுமதியில் இருந்து குறியிடப்பட்ட வர்த்தமானி மெட்டாடேட்டாவைத் தேடுங்கள்.",
    "languageLabel": "முகப்பு மொழி",
    "statRecords": "குறியிடப்பட்ட பதிவுகள்",
    "statStates": "மாநிலங்கள் மற்றும் யூ.டி.",
    "statPublications": "வெளியீடுகள்",
    "statesHeading": "மாநிலங்கள்",
    "clear": "அழிக்க",
    "queryLabel": "தேடல் உரை",
    "queryPlaceholder": "துறை, பொருள், வர்த்தமானி எண், அறிவிப்பு எண்",
    "stateLabel": "மாநிலம்",
    "publicationLabel": "வெளியீடு",
    "dateFromLabel": "தொடக்க தேதி",
    "dateToLabel": "முடிவு தேதி",
    "searchButton": "காப்பகத்தைத் தேடு",
    "resetButton": "மீட்டமை",
    "latestButton": "சமீபத்தியதை காட்டு",
    "hint": "குறிப்பு: மாநில அல்லது வெளியீட்டு வடிகட்டிகள் வேகமாக இயங்கும்.",
    "loadingSummary": "சுருக்கம் ஏற்றப்படுகிறது…",
    "preparing": "காப்பக காட்சி தயாராகிறது.",
    "previous": "முந்தையது",
    "next": "அடுத்தது",
    "pageOf": "பக்கம் {page} / {totalPages}",
    "chatTitle": "காப்பக உதவியாளர்",
    "chatSubtitle": "வடிகட்டிகள், சுருக்கங்கள் அல்லது தற்போதைய முடிவுகள் பற்றி உதவி கேளுங்கள்.",
    "clearChat": "அரட்டை அழிக்க",
    "chatPlaceholder": "உதா: கர்நாடகாவில் நிலச் சுரண்டலைத் தேடு",
    "ask": "கேள்",
    "allStates": "அனைத்து மாநிலங்களும்",
    "allPublications": "அனைத்து வெளியீடுகளும்",
    "latestDescriptor": "சமீபத்தில் வெளியான வர்த்தமானிகள்",
    "matchingDescriptor": "பொருந்தும் முடிவுகள்",
    "noMatching": "பொருந்தும் பதிவு இல்லை",
    "noResultsBody": "தற்போதைய வடிகட்டிகளுக்கு பதிவுகள் இல்லை.",
    "resultShowing": "{start}-{end} / {total} காட்டப்படுகிறது",
    "statusLatest": "முன்கூட்டியே ஏற்றப்பட்ட சமீபத்திய பதிவுகள் காட்டப்படுகின்றன.",
    "statusSearch": "{count} பொருந்தும் பதிவுகளில் தேடல் முடிந்தது.",
    "statusLoadingShard": "{label} க்காக {current} / {total} ஷார்டுகள் ஏற்றப்படுகின்றன…",
    "statusFiltering": "பதிவுகள் வடிகட்டப்படுகின்றன…",
    "statusFailed": "நிலையான காப்பக கோரிக்கை தோல்வியடைந்தது.",
    "resultState": "மாநிலம்",
    "resultPublication": "வெளியீடு",
    "resultMetadataFile": "மெட்டாடேட்டா கோப்பு",
    "resultRawFile": "மூல கோப்பு",
    "linkPublication": "வெளியீடு",
    "linkXml": "XML கோப்பு",
    "linkPdf": "PDF கோப்பு",
    "linkRaw": "மூல கோப்பு",
    "linkSource": "மூலத்தைத் திற",
    "unknownDate": "தேதி தெரியவில்லை",
    "undated": "தேதியற்றது",
    "notification": "அறிவிப்பு {index}",
    "chatWelcome": "காப்பகத்தை ஆராய நான் உதவலாம். மாநிலம், வெளியீடு அல்லது மெட்டாடேட்டா தேடலைக் கேளுங்கள்.",
    "chatNoResults": "இப்போது பொருந்தும் பதிவுகள் இல்லை.",
    "chatSummaryLine1": "தற்போதைய காட்சியில் {count} பொருந்தும் பதிவுகள் உள்ளன.",
    "chatSummaryStates": "முக்கிய மாநிலங்கள்: {items}.",
    "chatSummaryPublications": "முக்கிய வெளியீடுகள்: {items}.",
    "chatMetadataNone": "\"{query}\"க்கு பொருத்தம் கிடைக்கவில்லை.",
    "chatMetadataFound": "\"{query}\"க்கு {count} பொருந்தும் பதிவுகள் கிடைத்தன.",
    "chatMetadataExamples": "சில எடுத்துக்காட்டுகள்: {items}.",
    "chatReset": "வடிகட்டிகள் நீக்கப்பட்டன.",
    "chatLatest": "சமீபத்திய காட்சிக்கு திரும்பினேன்.",
    "chatFilterApplied": "{labels} வடிகட்டி பயன்படுத்தப்பட்டது. இப்போது {count} பதிவுகள் உள்ளன.",
    "chatHelp": "நான் உதவ முடியும்:\n- மாநிலம் அல்லது வெளியீட்டு வடிகட்டி\n- மெட்டாடேட்டா தேடல்\n- மீட்டமை\n- சமீபத்திய காட்சி\n- முடிவு சுருக்கம்",
    "chatFallback": "இவற்றை முயற்சிக்கவும்:\n- தற்போதைய முடிவுகளைச் சுருக்கு\n- ஆந்திரப் பிரதேசம் காட்டு\n- கர்நாடகாவில் நிலச் சுரண்டலைத் தேடு\n- மீட்டமை"
  },
  "te": {
    "code": "te-IN",
    "title": "అధికారిక గెజిట్ అన్వేషకుడు",
    "eyebrow": "సర్వెంట్స్ ఆఫ్ నాలెడ్జ్",
    "lede": "పూర్తయిన ఆర్కైవ్ ఎగుమతి నుండి సూచిక చేయబడిన గెజిట్ మెటాడేటాను వెతకండి.",
    "languageLabel": "ఇంటర్‌ఫేస్ భాష",
    "statRecords": "సూచిక చేసిన రికార్డులు",
    "statStates": "రాష్ట్రాలు మరియు కేంద్ర పాలిత ప్రాంతాలు",
    "statPublications": "ప్రచురణలు",
    "statesHeading": "రాష్ట్రాలు",
    "clear": "తొలగించు",
    "queryLabel": "శోధన పాఠ్యం",
    "queryPlaceholder": "శాఖ, విషయం, గెజిట్ నంబర్, నోటిఫికేషన్ నంబర్",
    "stateLabel": "రాష్ట్రం",
    "publicationLabel": "ప్రచురణ",
    "dateFromLabel": "ప్రారంభ తేదీ",
    "dateToLabel": "ముగింపు తేదీ",
    "searchButton": "ఆర్కైవ్‌లో వెతుకు",
    "resetButton": "రీసెట్",
    "latestButton": "తాజావి చూపించు",
    "hint": "సూచన: రాష్ట్రం లేదా ప్రచురణ ఫిల్టర్లు వేగంగా పనిచేస్తాయి.",
    "loadingSummary": "సారాంశం లోడ్ అవుతోంది…",
    "preparing": "ఆర్కైవ్ దృశ్యం సిద్ధమవుతోంది.",
    "previous": "మునుపటి",
    "next": "తదుపరి",
    "pageOf": "పేజీ {page} / {totalPages}",
    "chatTitle": "ఆర్కైవ్ సహాయకుడు",
    "chatSubtitle": "ఫిల్టర్లు, సారాంశాలు లేదా ప్రస్తుత ఫలితాలపై సహాయం అడగండి.",
    "clearChat": "చాట్ క్లియర్ చేయి",
    "chatPlaceholder": "ఉదాహరణ: కర్ణాటకలో భూసేకరణ వెతుకు",
    "ask": "అడుగు",
    "allStates": "అన్ని రాష్ట్రాలు",
    "allPublications": "అన్ని ప్రచురణలు",
    "latestDescriptor": "తాజాగా ప్రచురించిన గెజిట్‌లు",
    "matchingDescriptor": "సరిపోలిన ఫలితాలు",
    "noMatching": "సరిపోలిన రికార్డులు లేవు",
    "noResultsBody": "ప్రస్తుత ఫిల్టర్లకు రికార్డులు లభించలేదు.",
    "resultShowing": "{start}-{end} / {total} చూపిస్తోంది",
    "statusLatest": "ముందుగా లోడ్ చేసిన తాజా రికార్డులు చూపిస్తున్నాం.",
    "statusSearch": "{count} సరిపోలిన రికార్డులపై శోధన పూర్తయింది.",
    "statusLoadingShard": "{label} కోసం {current} / {total} షార్డులు లోడ్ అవుతున్నాయి…",
    "statusFiltering": "రికార్డులు ఫిల్టర్ అవుతున్నాయి…",
    "statusFailed": "స్టాటిక్ ఆర్కైవ్ అభ్యర్థన విఫలమైంది.",
    "resultState": "రాష్ట్రం",
    "resultPublication": "ప్రచురణ",
    "resultMetadataFile": "మెటాడేటా ఫైల్",
    "resultRawFile": "మూల ఫైల్",
    "linkPublication": "ప్రచురణ",
    "linkXml": "XML ఫైల్",
    "linkPdf": "PDF ఫైల్",
    "linkRaw": "మూల ఫైల్",
    "linkSource": "మూలం తెరువు",
    "unknownDate": "తేదీ తెలియదు",
    "undated": "తేదీ లేదు",
    "notification": "నోటిఫికేషన్ {index}",
    "chatWelcome": "ఆర్కైవ్‌ను అన్వేషించడంలో నేను సహాయపడగలను. రాష్ట్రం, ప్రచురణ లేదా మెటాడేటా శోధన గురించి అడగండి.",
    "chatNoResults": "ఇప్పుడు సరిపోలిన రికార్డులు లేవు.",
    "chatSummaryLine1": "ప్రస్తుత దృశ్యంలో {count} సరిపోలిన రికార్డులు ఉన్నాయి.",
    "chatSummaryStates": "ముఖ్య రాష్ట్రాలు: {items}.",
    "chatSummaryPublications": "ముఖ్య ప్రచురణలు: {items}.",
    "chatMetadataNone": "\"{query}\"కు సరిపోలినవి లభించలేదు.",
    "chatMetadataFound": "\"{query}\"కు {count} సరిపోలిన రికార్డులు దొరికాయి.",
    "chatMetadataExamples": "కొన్ని ఉదాహరణలు: {items}.",
    "chatReset": "ఫిల్టర్లు తొలగించబడ్డాయి.",
    "chatLatest": "తాజా దృశ్యానికి తిరిగాను.",
    "chatFilterApplied": "{labels} ఫిల్టర్ అమలైంది. ఇప్పుడు {count} రికార్డులు ఉన్నాయి.",
    "chatHelp": "నేను సహాయం చేయగలను:\n- రాష్ట్రం లేదా ప్రచురణ ఫిల్టర్\n- మెటాడేటా శోధన\n- రీసెట్\n- తాజా దృశ్యం\n- ఫలితాల సారాంశం",
    "chatFallback": "ఇవన్ని ప్రయత్నించండి:\n- ప్రస్తుత ఫలితాల సారాంశం చెప్పు\n- ఆంధ్రప్రదేశ్ చూపించు\n- కర్ణాటకలో భూసేకరణ వెతుకు\n- రీసెట్"
  },
  "ml": {
    "code": "ml-IN",
    "title": "ഔദ്യോഗിക ഗസറ്റ് എക്സ്പ്ലോറർ",
    "eyebrow": "സെർവന്റ്സ് ഓഫ് നോളജ്",
    "lede": "പൂർത്തിയായ ആർക്കൈവ് എക്സ്പോർട്ടിൽ നിന്ന് ഇൻഡക്സ് ചെയ്ത ഗസറ്റ് മെറ്റാഡേറ്റ തിരയുക.",
    "languageLabel": "ഇന്റർഫേസ് ഭാഷ",
    "statRecords": "ഇൻഡക്സ് ചെയ്ത രേഖകൾ",
    "statStates": "സംസ്ഥാനങ്ങളും കേന്ദ്രഭരണ പ്രദേശങ്ങളും",
    "statPublications": "പ്രസിദ്ധീകരണങ്ങൾ",
    "statesHeading": "സംസ്ഥാനങ്ങൾ",
    "clear": "മായ്ക്കുക",
    "queryLabel": "തിരയൽ വാചകം",
    "queryPlaceholder": "വകുപ്പ്, വിഷയം, ഗസറ്റ് നമ്പർ, നോട്ടിഫിക്കേഷൻ നമ്പർ",
    "stateLabel": "സംസ്ഥാനം",
    "publicationLabel": "പ്രസിദ്ധീകരണം",
    "dateFromLabel": "ആരംഭ തീയതി",
    "dateToLabel": "അവസാന തീയതി",
    "searchButton": "ആർക്കൈവ് തിരയുക",
    "resetButton": "റീസെറ്റ്",
    "latestButton": "പുതിയത് കാണിക്കുക",
    "hint": "സൂചന: സംസ്ഥാനം അല്ലെങ്കിൽ പ്രസിദ്ധീകരണ ഫിൽറ്ററുകൾ വേഗത്തിലാണ്.",
    "loadingSummary": "സാരാംശം ലോഡ് ചെയ്യുന്നു…",
    "preparing": "ആർക്കൈവ് ദൃശ്യം തയ്യാറാക്കുന്നു.",
    "previous": "മുമ്പത്തെ",
    "next": "അടുത്തത്",
    "pageOf": "പേജ് {page} / {totalPages}",
    "chatTitle": "ആർക്കൈവ് സഹായി",
    "chatSubtitle": "ഫിൽറ്ററുകൾ, സാരാംശങ്ങൾ അല്ലെങ്കിൽ നിലവിലെ ഫലങ്ങൾ സംബന്ധിച്ച് സഹായം ചോദിക്കൂ.",
    "clearChat": "ചാറ്റ് മായ്ക്കുക",
    "chatPlaceholder": "ഉദാ: കര്‍ണാടകയിൽ ഭൂമി ഏറ്റെടുക്കൽ തിരയൂ",
    "ask": "ചോദിക്കുക",
    "allStates": "എല്ലാ സംസ്ഥാനങ്ങളും",
    "allPublications": "എല്ലാ പ്രസിദ്ധീകരണങ്ങളും",
    "latestDescriptor": "ഏറ്റവും പുതിയ പ്രസിദ്ധീകരിച്ച ഗസറ്റുകൾ",
    "matchingDescriptor": "ഒത്തുപോകുന്ന ഫലങ്ങൾ",
    "noMatching": "ഒത്തുപോകുന്ന രേഖകളില്ല",
    "noResultsBody": "നിലവിലെ ഫിൽറ്ററുകൾക്ക് രേഖകളൊന്നും ലഭിച്ചില്ല.",
    "resultShowing": "{start}-{end} / {total} കാണിക്കുന്നു",
    "statusLatest": "മുൻകൂർ ലോഡ് ചെയ്ത ഏറ്റവും പുതിയ രേഖകൾ കാണിക്കുന്നു.",
    "statusSearch": "{count} ഒത്തുപോകുന്ന രേഖകളിൽ തിരച്ചിൽ പൂർത്തിയായി.",
    "statusLoadingShard": "{label}ക്കായി {current} / {total} ഷാർഡുകൾ ലോഡ് ചെയ്യുന്നു…",
    "statusFiltering": "രേഖകൾ ഫിൽറ്റർ ചെയ്യുന്നു…",
    "statusFailed": "സ്റ്റാറ്റിക് ആർക്കൈവ് അഭ്യർത്ഥന പരാജയപ്പെട്ടു.",
    "resultState": "സംസ്ഥാനം",
    "resultPublication": "പ്രസിദ്ധീകരണം",
    "resultMetadataFile": "മെറ്റാഡേറ്റ ഫയൽ",
    "resultRawFile": "മൂല ഫയൽ",
    "linkPublication": "പ്രസിദ്ധീകരണം",
    "linkXml": "XML ഫയൽ",
    "linkPdf": "PDF ഫയൽ",
    "linkRaw": "മൂല ഫയൽ",
    "linkSource": "മൂലം തുറക്കുക",
    "unknownDate": "തീയതി അറിയില്ല",
    "undated": "തീയതിയില്ല",
    "notification": "നോട്ടിഫിക്കേഷൻ {index}",
    "chatWelcome": "ആർക്കൈവ് മനസ്സിലാക്കാൻ ഞാൻ സഹായിക്കാം. സംസ്ഥാനം, പ്രസിദ്ധീകരണം അല്ലെങ്കിൽ മെറ്റാഡേറ്റ തിരച്ചിൽ സംബന്ധിച്ച് ചോദിക്കൂ.",
    "chatNoResults": "ഇപ്പോൾ ഒത്തുപോകുന്ന രേഖകളില്ല.",
    "chatSummaryLine1": "നിലവിലെ ദൃശ്യത്തിൽ {count} ഒത്തുപോകുന്ന രേഖകളുണ്ട്.",
    "chatSummaryStates": "പ്രധാന സംസ്ഥാനങ്ങൾ: {items}.",
    "chatSummaryPublications": "പ്രധാന പ്രസിദ്ധീകരണങ്ങൾ: {items}.",
    "chatMetadataNone": "\"{query}\"യ്ക്ക് പൊരുത്തം കണ്ടെത്തിയില്ല.",
    "chatMetadataFound": "\"{query}\"യ്ക്ക് {count} ഒത്തുപോകുന്ന രേഖകൾ കണ്ടെത്തി.",
    "chatMetadataExamples": "ചില ഉദാഹരണങ്ങൾ: {items}.",
    "chatReset": "ഫിൽറ്ററുകൾ നീക്കി.",
    "chatLatest": "ഏറ്റവും പുതിയ ദൃശ്യത്തിലേക്ക് തിരിഞ്ഞു.",
    "chatFilterApplied": "{labels} ഫിൽറ്റർ പ്രയോഗിച്ചു. ഇപ്പോൾ {count} രേഖകളുണ്ട്.",
    "chatHelp": "എനിക്ക് സഹായിക്കാനാകും:\n- സംസ്ഥാനം അല്ലെങ്കിൽ പ്രസിദ്ധീകരണ ഫിൽറ്റർ\n- മെറ്റാഡേറ്റ തിരച്ചിൽ\n- റീസെറ്റ്\n- ഏറ്റവും പുതിയ ദൃശ്യം\n- ഫലങ്ങളുടെ സാരാംശം",
    "chatFallback": "ഇവ പരീക്ഷിക്കൂ:\n- നിലവിലെ ഫലങ്ങളുടെ സാരാംശം നൽകൂ\n- ആന്ധ്രാപ്രദേശം കാണിക്കൂ\n- കര്‍ണാടകയിൽ ഭൂമി ഏറ്റെടുക്കൽ തിരയൂ\n- റീസെറ്റ്"
  }
};

const COMMAND_KEYWORDS = {
  reset: ["reset", "clear", "ಮರುಹೊಂದಿಸು", "रीसेट", "साफ", "மீட்டமை", "அழிக்க", "రీసెట్", "മായ്ക്കുക"],
  latest: ["latest", "newest", "recent", "ಇತ್ತೀಚಿನ", "नवीनतम", "சமீபத்திய", "తాజా", "പുതിയത്"],
  summary: ["summary", "summarize", "visible", "ಸಾರಾಂಶ", "सारांश", "சுருக்க", "సారాంశ", "സാരാംശ"],
  help: ["help", "what can you do", "ಸಹಾಯ", "मदद", "உதவி", "సహాయం", "സഹായം"]
};

const state = {
  summary: null,
  latestRecords: [],
  publicationCache: new Map(),
  currentMode: "latest",
  currentResults: [],
  currentPage: 1,
  lastCriteriaKey: "",
  locale: localStorage.getItem("oge_locale") || "en",
};

const elements = {
  eyebrowText: document.querySelector("#eyebrow-text"),
  titleText: document.querySelector("#title-text"),
  ledeText: document.querySelector("#lede-text"),
  languageLabel: document.querySelector("#language-label"),
  languageSelect: document.querySelector("#language-select"),
  statLabelRecords: document.querySelector("#stat-label-records"),
  statLabelStates: document.querySelector("#stat-label-states"),
  statLabelPublications: document.querySelector("#stat-label-publications"),
  recordCount: document.querySelector("#record-count"),
  stateCount: document.querySelector("#state-count"),
  publicationCount: document.querySelector("#publication-count"),
  statesHeading: document.querySelector("#states-heading"),
  stateList: document.querySelector("#state-list"),
  stateSelect: document.querySelector("#state-select"),
  publicationSelect: document.querySelector("#publication-select"),
  queryInput: document.querySelector("#query-input"),
  dateFromInput: document.querySelector("#date-from-input"),
  dateToInput: document.querySelector("#date-to-input"),
  queryLabel: document.querySelector("#query-label"),
  stateLabel: document.querySelector("#state-label"),
  publicationLabel: document.querySelector("#publication-label"),
  dateFromLabel: document.querySelector("#date-from-label"),
  dateToLabel: document.querySelector("#date-to-label"),
  resultSummary: document.querySelector("#result-summary"),
  statusMessage: document.querySelector("#status-message"),
  results: document.querySelector("#results"),
  prevPage: document.querySelector("#prev-page"),
  nextPage: document.querySelector("#next-page"),
  pageLabel: document.querySelector("#page-label"),
  searchButton: document.querySelector("#search-button"),
  resetButton: document.querySelector("#reset-button"),
  latestButton: document.querySelector("#latest-button"),
  clearStateButton: document.querySelector("#clear-state"),
  hintText: document.querySelector("#hint-text"),
  chatTitle: document.querySelector("#chat-title"),
  chatSubtitle: document.querySelector("#chat-subtitle"),
  chatResetButton: document.querySelector("#chat-reset-button"),
  chatLog: document.querySelector("#chat-log"),
  chatInput: document.querySelector("#chat-input"),
  chatSendButton: document.querySelector("#chat-send-button"),
  template: document.querySelector("#result-template"),
};

function localeStrings() {
  return LOCALES[state.locale] || LOCALES.en;
}

function t(key, vars = {}) {
  let text = localeStrings()[key] ?? LOCALES.en[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

function numberFormat(value) {
  return new Intl.NumberFormat(localeStrings().code || "en-IN").format(value || 0);
}

function titleCase(key) {
  return key.replace(/_/g, " ").replace(/\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function buildSearchText(record) {
  if (record.__searchText) return record.__searchText;
  const metadataBits = Object.entries(record.metadata || {}).map(([key, value]) => `${key} ${value}`);
  const notificationBits = (record.notifications || []).flatMap((entry) => Object.entries(entry).map(([key, value]) => `${key} ${value}`));
  record.__searchText = [record.state_name, record.publication_title, record.publication_slug, record.meta_file, record.raw_file, record.gazette_date, ...metadataBits, ...notificationBits].filter(Boolean).join(" ").toLowerCase();
  return record.__searchText;
}

function matchesCriteria(record, criteria) {
  if (criteria.state && record.state_name !== criteria.state) return false;
  if (criteria.publication && record.publication_slug !== criteria.publication) return false;
  if (criteria.dateFrom && (record.gazette_date || "") < criteria.dateFrom) return false;
  if (criteria.dateTo && (record.gazette_date || "") > criteria.dateTo) return false;
  if (!criteria.query) return true;
  return buildSearchText(record).includes(criteria.query);
}

function currentCriteria() {
  return { query: elements.queryInput.value.trim().toLowerCase(), state: elements.stateSelect.value, publication: elements.publicationSelect.value, dateFrom: elements.dateFromInput.value, dateTo: elements.dateToInput.value };
}

function criteriaKey(criteria) { return JSON.stringify(criteria); }

function sortRecords(records) {
  return [...records].sort((left, right) => `${right.gazette_date || ""}|${right.publication_slug || ""}|${right.file_stem || ""}`.localeCompare(`${left.gazette_date || ""}|${left.publication_slug || ""}|${left.file_stem || ""}`));
}

function setStatus(message) { elements.statusMessage.textContent = message; }

function appendChatMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  elements.chatLog.appendChild(bubble);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function clearChat() { elements.chatLog.innerHTML = ""; appendChatMessage("assistant", t("chatWelcome")); }

function metadataSample(records) {
  return records.slice(0, 3).map((record) => record.metadata?.title || record.metadata?.subject || record.metadata?.department || record.meta_file).filter(Boolean).join("; ");
}

function keywordHit(bucket, text) { return COMMAND_KEYWORDS[bucket].some((token) => text.includes(token.toLowerCase())); }

function extractMetadataIntent(message, stateMention, publicationMention) {
  let cleaned = ` ${message.toLowerCase()} `;
  for (const phrase of [stateMention, publicationMention]) if (phrase) cleaned = cleaned.replaceAll(` ${String(phrase).toLowerCase()} `, " ");
  const noise = ["show", "find", "search", "look through", "look up", "look for", "metadata", "gazette", "gazettes", "records", "record", "entries", "entry", "about", "for", "with", "from", "in", "please", "ತೋರಿಸಿ", "ಹುಡುಕಿ", "ಹುಡುಕು", "दिखाओ", "खोज", "காட்டு", "தேடு", "చూపించు", "వెతుకు", "കാണിക്കൂ", "തിരയൂ"];
  for (const token of noise) cleaned = cleaned.replaceAll(` ${token} `, " ");
  return cleaned.replace(/\s+/g, " ").trim();
}

function summarizeMetadataSearch(records, queryText) {
  if (!records.length) return t("chatMetadataNone", { query: queryText });
  const sample = metadataSample(records);
  return [t("chatMetadataFound", { query: queryText, count: numberFormat(records.length) }), sample ? t("chatMetadataExamples", { items: sample }) : ""].filter(Boolean).join(" ");
}

function summarizeRecords(records) {
  if (!records.length) return t("chatNoResults");
  const stateCounts = new Map();
  const publicationCounts = new Map();
  for (const record of records.slice(0, 200)) {
    stateCounts.set(record.state_name, (stateCounts.get(record.state_name) || 0) + 1);
    publicationCounts.set(record.publication_slug, (publicationCounts.get(record.publication_slug) || 0) + 1);
  }
  const topStates = [...stateCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => `${name} (${count})`).join(", ");
  const topPublications = [...publicationCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => `${name} (${count})`).join(", ");
  return [t("chatSummaryLine1", { count: numberFormat(records.length) }), topStates ? t("chatSummaryStates", { items: topStates }) : "", topPublications ? t("chatSummaryPublications", { items: topPublications }) : ""].filter(Boolean).join(" ");
}

function findStateMention(message) { const lowered = message.toLowerCase(); return (state.summary.states || []).find((name) => lowered.includes(name.toLowerCase())) || ""; }
function findPublicationMention(message) { const lowered = message.toLowerCase(); return (state.summary.publications || []).find((publication) => lowered.includes(publication.slug.toLowerCase()) || lowered.includes((publication.title || "").toLowerCase()))?.slug || ""; }

async function answerChat(message) {
  const lowered = message.toLowerCase();
  if (keywordHit("reset", lowered)) { resetFilters(); await executeSearch(); return t("chatReset"); }
  if (keywordHit("latest", lowered)) { resetFilters(); await executeSearch(); return t("chatLatest"); }
  if (keywordHit("summary", lowered)) return summarizeRecords(state.currentResults);
  if (keywordHit("help", lowered)) return t("chatHelp");
  const stateMention = findStateMention(message);
  const publicationMention = findPublicationMention(message);
  const metadataIntent = extractMetadataIntent(message, stateMention, publicationMention);
  if (stateMention) syncStateFilter(stateMention);
  if (publicationMention) { renderPublicationOptions(); elements.publicationSelect.value = publicationMention; }
  if (metadataIntent) { elements.queryInput.value = metadataIntent; await executeSearch(); return summarizeMetadataSearch(state.currentResults, metadataIntent); }
  if (stateMention || publicationMention) { await executeSearch(); return t("chatFilterApplied", { labels: [stateMention, publicationMention].filter(Boolean).join(" / "), count: numberFormat(state.currentResults.length) }); }
  elements.queryInput.value = message.trim();
  await executeSearch();
  return summarizeMetadataSearch(state.currentResults, message.trim());
}

function setSummary(summary) { elements.recordCount.textContent = numberFormat(summary.record_count); elements.stateCount.textContent = numberFormat(summary.state_count); elements.publicationCount.textContent = numberFormat(summary.publication_count); }

function applyLocaleText() {
  document.documentElement.lang = state.locale;
  document.title = t("title");
  elements.eyebrowText.textContent = t("eyebrow");
  elements.titleText.textContent = t("title");
  elements.ledeText.textContent = t("lede");
  elements.languageLabel.textContent = t("languageLabel");
  elements.statLabelRecords.textContent = t("statRecords");
  elements.statLabelStates.textContent = t("statStates");
  elements.statLabelPublications.textContent = t("statPublications");
  elements.statesHeading.textContent = t("statesHeading");
  elements.clearStateButton.textContent = t("clear");
  elements.queryLabel.textContent = t("queryLabel");
  elements.stateLabel.textContent = t("stateLabel");
  elements.publicationLabel.textContent = t("publicationLabel");
  elements.dateFromLabel.textContent = t("dateFromLabel");
  elements.dateToLabel.textContent = t("dateToLabel");
  elements.searchButton.textContent = t("searchButton");
  elements.resetButton.textContent = t("resetButton");
  elements.latestButton.textContent = t("latestButton");
  elements.hintText.textContent = t("hint");
  elements.prevPage.textContent = t("previous");
  elements.nextPage.textContent = t("next");
  elements.chatTitle.textContent = t("chatTitle");
  elements.chatSubtitle.textContent = t("chatSubtitle");
  elements.chatResetButton.textContent = t("clearChat");
  elements.chatSendButton.textContent = t("ask");
  elements.queryInput.placeholder = t("queryPlaceholder");
  elements.chatInput.placeholder = t("chatPlaceholder");
}

function renderStateList() {
  const activeState = elements.stateSelect.value;
  const states = state.summary.states || [];
  const counts = state.summary.state_record_counts || {};
  elements.stateList.innerHTML = states.map((stateName) => `
    <button class="state-chip${activeState === stateName ? " active" : ""}" type="button" data-state="${escapeHtml(stateName)}">
      <span>${escapeHtml(stateName)}</span>
      <small>${numberFormat(counts[stateName] || 0)}</small>
    </button>
  `).join("");
}

function renderPublicationOptions() {
  const selectedState = elements.stateSelect.value;
  const manifest = state.summary.publications || [];
  const allowed = selectedState ? new Set(state.summary.state_publications[selectedState] || []) : null;
  const publications = manifest.filter((publication) => !allowed || allowed.has(publication.slug));
  const previousValue = elements.publicationSelect.value;
  elements.publicationSelect.innerHTML = [`<option value="">${escapeHtml(t("allPublications"))}</option>`, ...publications.map((publication) => `<option value="${escapeHtml(publication.slug)}">${escapeHtml(publication.title)} (${numberFormat(publication.count)})</option>`)].join("");
  if (publications.some((publication) => publication.slug === previousValue)) elements.publicationSelect.value = previousValue;
}

function renderResults(records, totalCount, descriptor) {
  elements.results.innerHTML = "";
  if (!records.length) {
    elements.results.innerHTML = `<div class="empty-state">${escapeHtml(t("noResultsBody"))}</div>`;
    elements.resultSummary.textContent = descriptor || t("noMatching");
    elements.pageLabel.textContent = t("pageOf", { page: 1, totalPages: 1 });
    elements.prevPage.disabled = true;
    elements.nextPage.disabled = true;
    return;
  }
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startIndex = (state.currentPage - 1) * PAGE_SIZE;
  const pageRecords = records.slice(startIndex, startIndex + PAGE_SIZE);
  for (const record of pageRecords) {
    const fragment = elements.template.content.cloneNode(true);
    fragment.querySelector(".breadcrumb").textContent = [record.state_name, record.publication_slug, record.gazette_date || t("undated"), record.file_stem].filter(Boolean).join(" / ");
    fragment.querySelector(".result-title").textContent = record.metadata?.title || record.metadata?.subject || record.metadata?.department || record.meta_file;
    fragment.querySelector(".date-pill").textContent = record.gazette_date || t("unknownDate");
    const fileLinks = fragment.querySelector(".file-links");
    const links = [[t("linkPublication"), record.raw_url], [t("linkXml"), record.meta_url], [record.raw_file?.toLowerCase().endsWith(".pdf") ? t("linkPdf") : t("linkRaw"), record.raw_url], [t("linkSource"), record.source_url]].filter(([, href], index, list) => href && list.findIndex((item) => item[1] === href) === index);
    fileLinks.innerHTML = links.map(([label, href]) => `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`).join("");
    const metaGrid = fragment.querySelector(".meta-grid");
    const metadataEntries = [[t("resultState"), record.state_name], [t("resultPublication"), record.publication_title], [t("resultMetadataFile"), record.meta_file], [t("resultRawFile"), record.raw_file], ...Object.entries(record.metadata || {}).slice(0, 10).map(([key, value]) => [titleCase(key), value])].filter(([, value]) => value);
    metaGrid.innerHTML = metadataEntries.map(([key, value]) => `<div class="meta-row"><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
    const notificationWrap = fragment.querySelector(".notification-wrap");
    if (record.notifications?.length) {
      notificationWrap.innerHTML = record.notifications.slice(0, 3).map((notification, idx) => {
        const body = Object.entries(notification).map(([key, value]) => `<div class="meta-row"><dt>${escapeHtml(titleCase(key))}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
        return `<section class="notification-card"><strong>${escapeHtml(t("notification", { index: idx + 1 }))}</strong><dl class="meta-grid">${body}</dl></section>`;
      }).join("");
    } else { notificationWrap.remove(); }
    elements.results.appendChild(fragment);
  }
  elements.resultSummary.textContent = `${descriptor} · ${t("resultShowing", { start: numberFormat(startIndex + 1), end: numberFormat(Math.min(startIndex + pageRecords.length, totalCount)), total: numberFormat(totalCount) })}`;
  elements.pageLabel.textContent = t("pageOf", { page: numberFormat(state.currentPage), totalPages: numberFormat(totalPages) });
  elements.prevPage.disabled = state.currentPage <= 1;
  elements.nextPage.disabled = state.currentPage >= totalPages;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  if (!url.endsWith(".gz")) return response.json();
  if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support gzip archive loading for the static dataset.");
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).json();
}

async function loadPublication(publicationSlug) {
  if (state.publicationCache.has(publicationSlug)) return state.publicationCache.get(publicationSlug);
  const manifestEntry = (state.summary.publications || []).find((item) => item.slug === publicationSlug);
  if (!manifestEntry) return [];
  const records = await fetchJson(manifestEntry.path);
  state.publicationCache.set(publicationSlug, records);
  return records;
}

async function loadMatchingRecords(criteria) {
  const manifest = state.summary.publications || [];
  if (!criteria.query && !criteria.state && !criteria.publication && !criteria.dateFrom && !criteria.dateTo) { state.currentMode = "latest"; return { records: state.latestRecords, descriptor: t("latestDescriptor") }; }
  let targetPublications = [];
  if (criteria.publication) targetPublications = [criteria.publication];
  else if (criteria.state) targetPublications = state.summary.state_publications[criteria.state] || [];
  else targetPublications = manifest.map((item) => item.slug);
  const uniquePublications = [...new Set(targetPublications)];
  const targetLabel = criteria.publication || criteria.state || t("matchingDescriptor");
  const loaded = [];
  for (let index = 0; index < uniquePublications.length; index += 1) {
    setStatus(t("statusLoadingShard", { current: numberFormat(index + 1), total: numberFormat(uniquePublications.length), label: targetLabel }));
    loaded.push(...await loadPublication(uniquePublications[index]));
  }
  state.currentMode = "search";
  return { records: sortRecords(loaded.filter((record) => matchesCriteria(record, criteria))), descriptor: t("matchingDescriptor") };
}

async function executeSearch({ resetPage = true } = {}) {
  const criteria = currentCriteria();
  const key = criteriaKey(criteria);
  if (resetPage || key !== state.lastCriteriaKey) state.currentPage = 1;
  state.lastCriteriaKey = key;
  setStatus(t("statusFiltering"));
  try {
    const { records, descriptor } = await loadMatchingRecords(criteria);
    state.currentResults = records;
    renderResults(records, records.length, descriptor);
    setStatus(state.currentMode === "latest" ? t("statusLatest") : t("statusSearch", { count: numberFormat(records.length) }));
  } catch (error) {
    elements.results.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    elements.resultSummary.textContent = t("noMatching");
    setStatus(t("statusFailed"));
  }
}

function syncStateFilter(nextState) { elements.stateSelect.value = nextState || ""; renderPublicationOptions(); renderStateList(); }
function resetFilters() { elements.queryInput.value = ""; elements.dateFromInput.value = ""; elements.dateToInput.value = ""; elements.publicationSelect.value = ""; syncStateFilter(""); }

function rerenderForLocale() { applyLocaleText(); setSummary(state.summary); renderStateList(); renderPublicationOptions(); renderResults(state.currentResults, state.currentResults.length, state.currentMode === "latest" ? t("latestDescriptor") : t("matchingDescriptor")); }

function attachEvents() {
  elements.stateList.addEventListener("click", (event) => { const button = event.target.closest("[data-state]"); if (!button) return; syncStateFilter(button.dataset.state); executeSearch(); });
  elements.stateSelect.addEventListener("change", () => syncStateFilter(elements.stateSelect.value));
  elements.languageSelect.addEventListener("change", () => { state.locale = elements.languageSelect.value; localStorage.setItem("oge_locale", state.locale); rerenderForLocale(); clearChat(); });
  elements.searchButton.addEventListener("click", () => executeSearch());
  elements.resetButton.addEventListener("click", () => { resetFilters(); executeSearch(); });
  elements.latestButton.addEventListener("click", () => { resetFilters(); executeSearch(); });
  elements.clearStateButton.addEventListener("click", () => { syncStateFilter(""); executeSearch(); });
  elements.prevPage.addEventListener("click", () => { if (state.currentPage <= 1) return; state.currentPage -= 1; renderResults(state.currentResults, state.currentResults.length, state.currentMode === "latest" ? t("latestDescriptor") : t("matchingDescriptor")); });
  elements.nextPage.addEventListener("click", () => { const totalPages = Math.max(1, Math.ceil(state.currentResults.length / PAGE_SIZE)); if (state.currentPage >= totalPages) return; state.currentPage += 1; renderResults(state.currentResults, state.currentResults.length, state.currentMode === "latest" ? t("latestDescriptor") : t("matchingDescriptor")); });
  elements.queryInput.addEventListener("keydown", (event) => { if (event.key === "Enter") executeSearch(); });
  elements.chatSendButton.addEventListener("click", async () => { const message = elements.chatInput.value.trim(); if (!message) return; appendChatMessage("user", message); elements.chatInput.value = ""; appendChatMessage("assistant", await answerChat(message)); });
  elements.chatInput.addEventListener("keydown", (event) => { if (event.key !== "Enter") return; event.preventDefault(); elements.chatSendButton.click(); });
  elements.chatResetButton.addEventListener("click", () => clearChat());
}

async function init() {
  const [summary, latest] = await Promise.all([fetchJson(summaryUrl), fetchJson(latestUrl)]);
  state.summary = summary;
  state.latestRecords = latest;
  if (!LOCALES[state.locale]) state.locale = "en";
  elements.languageSelect.value = state.locale;
  applyLocaleText();
  setSummary(summary);
  elements.stateSelect.innerHTML = [`<option value="">${escapeHtml(t("allStates"))}</option>`, ...(summary.states || []).map((stateName) => `<option value="${escapeHtml(stateName)}">${escapeHtml(stateName)}</option>`)].join("");
  renderPublicationOptions();
  renderStateList();
  attachEvents();
  clearChat();
  await executeSearch();
}

init().catch((error) => { elements.resultSummary.textContent = t("loadingSummary"); setStatus(error.message); elements.results.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`; });
