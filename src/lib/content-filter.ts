import { 
  ContentFilterConfig, 
  WhitelistItem, 
  AllowedCategory, 
  FilterResult,
  ContentType 
} from './types';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'data', 'content-filter.json');

const DEFAULT_CONFIG: ContentFilterConfig = {
  enabled: true,
  defaultDeny: true,
    allowedCategories: ['education', 'quran', 'programming', 'science'],

  whitelist: [],
  blockedKeywords: [],
  maxResults: 50,
};

const CATEGORY_KEYWORDS: Record<AllowedCategory, string[]> = {
  education: ['تعليم', 'درس', 'شرح', 'كورس', 'course', 'tutorial', 'learn', 'education', 'lecture', 'محاضرة', 'مدرسة', 'جامعة', 'university', 'school', 'تعلم', 'دورة', 'training', 'workshop', 'ورشة'],
  quran: ['قرآن', 'quran', 'تلاوة', 'تجويد', 'حفظ', 'recitation', 'tajweed', 'سورة', 'مصحف', 'القرآن الكريم', 'قارئ', 'ترتيل', 'تفسير', 'آية'],
  programming: ['برمجة', 'programming', 'code', 'كود', 'javascript', 'python', 'react', 'developer', 'مطور', 'web development', 'software', 'برامج', 'java', 'css', 'html', 'nodejs', 'api', 'database', 'frontend', 'backend', 'fullstack', 'تطوير', 'app'],
  science: ['علم', 'علوم', 'science', 'فيزياء', 'كيمياء', 'physics', 'chemistry', 'biology', 'أحياء', 'فضاء', 'space', 'تقنية', 'tech', 'technology', 'research', 'بحث', 'تجربة', 'experiment', 'ناسا', 'nasa'],
  documentary: ['وثائقي', 'documentary', 'فيلم وثائقي', 'documentaire', 'الجزيرة الوثائقية', 'ناشيونال جيوغرافيك', 'national geographic', 'bbc', 'discovery'],
  kids: ['أطفال', 'kids', 'children', 'تعليمي للأطفال', 'nursery', 'أناشيد', 'كرتون', 'cartoon', 'طفل', 'روضة', 'حضانة', 'قصص أطفال', 'تلوين', 'ألعاب تعليمية'],
  language: ['لغة', 'language', 'english', 'arabic', 'عربي', 'إنجليزي', 'grammar', 'vocabulary', 'تعلم اللغة', 'فرنسي', 'french', 'spanish', 'german', 'ألماني', 'إسباني', 'قواعد', 'نطق', 'pronunciation', 'ielts', 'toefl'],
  history: ['تاريخ', 'history', 'historical', 'حضارة', 'civilization', 'ancient', 'تاريخي', 'معارك', 'ملوك', 'إمبراطورية', 'empire', 'عصور', 'آثار', 'archaeology'],
  health: ['صحة', 'health', 'طب', 'medical', 'fitness', 'رياضة', 'تغذية', 'nutrition', 'تمارين', 'علاج', 'doctor', 'دكتور', 'مرض', 'وقاية', 'gym', 'يوغا', 'yoga', 'wellness'],
  mathematics: ['رياضيات', 'mathematics', 'math', 'حساب', 'جبر', 'algebra', 'هندسة', 'geometry', 'calculus', 'تفاضل', 'تكامل', 'إحصاء', 'statistics', 'أرقام'],
  business: ['أعمال', 'business', 'ريادة', 'entrepreneurship', 'تسويق', 'marketing', 'إدارة', 'management', 'استثمار', 'investment', 'مال', 'finance', 'شركة', 'startup', 'تجارة', 'اقتصاد', 'economy'],
  cooking: ['طبخ', 'cooking', 'طهي', 'وصفة', 'recipe', 'مطبخ', 'kitchen', 'أكل', 'food', 'حلويات', 'dessert', 'شيف', 'chef', 'مأكولات'],
  crafts: ['حرف', 'crafts', 'يدوية', 'handmade', 'diy', 'صناعة', 'فن', 'art', 'رسم', 'drawing', 'تصميم', 'design', 'خياطة', 'sewing', 'كروشيه', 'crochet'],
  nature: ['طبيعة', 'nature', 'حيوانات', 'animals', 'بيئة', 'environment', 'نباتات', 'plants', 'بحار', 'ocean', 'غابات', 'forest', 'wildlife', 'حياة برية'],
};

function ensureDataDirectory(): void {
  const dataDir = path.dirname(CONFIG_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function loadFilterConfig(): ContentFilterConfig {
  try {
    ensureDataDirectory();
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading filter config:', error);
  }
  return DEFAULT_CONFIG;
}

export function saveFilterConfig(config: ContentFilterConfig): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving filter config:', error);
    throw new Error('Failed to save filter configuration');
  }
}

export function isInWhitelist(
  youtubeId: string, 
  type: ContentType, 
  config: ContentFilterConfig
): boolean {
  return config.whitelist.some(
    item => item.youtubeId === youtubeId && item.type === type
  );
}

export function matchesAllowedCategory(
  title: string,
  description: string,
  tags: string[],
  config: ContentFilterConfig
): { matches: boolean; category?: AllowedCategory } {
  const searchText = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
  
  for (const category of config.allowedCategories) {
    const keywords = CATEGORY_KEYWORDS[category];
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return { matches: true, category };
      }
    }
  }
  
  return { matches: false };
}

export function containsBlockedKeyword(
  title: string,
  description: string,
  config: ContentFilterConfig
): { blocked: boolean; keyword?: string } {
  const searchText = `${title} ${description}`.toLowerCase();
  
  for (const keyword of config.blockedKeywords) {
    if (searchText.includes(keyword.toLowerCase())) {
      return { blocked: true, keyword };
    }
  }
  
  return { blocked: false };
}

export function filterContent(
  youtubeId: string,
  type: ContentType,
  title: string,
  description: string = '',
  tags: string[] = [],
  channelId?: string,
  forceEnabled?: boolean
): FilterResult {
  const config = loadFilterConfig();
  
  const isEnabled = forceEnabled !== undefined ? forceEnabled : config.enabled;
  
  if (!isEnabled) {
    return { allowed: true, reason: 'التصفية معطلة' };
  }

  if (isInWhitelist(youtubeId, type, config)) {
    return { allowed: true, reason: 'في القائمة البيضاء', matchedRule: 'whitelist' };
  }

  if (channelId && isInWhitelist(channelId, 'channel', config)) {
    return { allowed: true, reason: 'القناة في القائمة البيضاء', matchedRule: 'whitelist' };
  }

  const blockedCheck = containsBlockedKeyword(title, description, config);
  if (blockedCheck.blocked) {
    return { 
      allowed: false, 
      reason: `يحتوي على كلمة محظورة: ${blockedCheck.keyword}`,
      matchedRule: 'keyword'
    };
  }

  const categoryCheck = matchesAllowedCategory(title, description, tags, config);
  if (categoryCheck.matches) {
    return { 
      allowed: true, 
      reason: `يطابق الفئة المسموحة: ${categoryCheck.category}`,
      matchedRule: 'category'
    };
  }

  if (config.defaultDeny) {
    return { 
      allowed: false, 
      reason: 'المحتوى غير مسموح به افتراضياً',
      matchedRule: 'default_deny'
    };
  }

  return { allowed: true };
}

export function addToWhitelist(
  youtubeId: string,
  type: ContentType,
  title: string,
  reason?: string
): WhitelistItem {
  const config = loadFilterConfig();
  
  const existingIndex = config.whitelist.findIndex(
    item => item.youtubeId === youtubeId && item.type === type
  );
  
  if (existingIndex !== -1) {
    return config.whitelist[existingIndex];
  }

  const newItem: WhitelistItem = {
    id: `${type}_${youtubeId}_${Date.now()}`,
    type,
    youtubeId,
    title,
    addedAt: new Date().toISOString(),
    reason,
  };

  config.whitelist.push(newItem);
  saveFilterConfig(config);
  
  return newItem;
}

export function removeFromWhitelist(youtubeId: string, type: ContentType): boolean {
  const config = loadFilterConfig();
  
  const initialLength = config.whitelist.length;
  config.whitelist = config.whitelist.filter(
    item => !(item.youtubeId === youtubeId && item.type === type)
  );

  if (config.whitelist.length !== initialLength) {
    saveFilterConfig(config);
    return true;
  }
  
  return false;
}

export function updateAllowedCategories(categories: AllowedCategory[]): void {
  const config = loadFilterConfig();
  config.allowedCategories = categories;
  saveFilterConfig(config);
}

export function addBlockedKeyword(keyword: string): void {
  const config = loadFilterConfig();
  if (!config.blockedKeywords.includes(keyword.toLowerCase())) {
    config.blockedKeywords.push(keyword.toLowerCase());
    saveFilterConfig(config);
  }
}

export function removeBlockedKeyword(keyword: string): boolean {
  const config = loadFilterConfig();
  const initialLength = config.blockedKeywords.length;
  config.blockedKeywords = config.blockedKeywords.filter(
    k => k.toLowerCase() !== keyword.toLowerCase()
  );
  
  if (config.blockedKeywords.length !== initialLength) {
    saveFilterConfig(config);
    return true;
  }
  
  return false;
}

export function setFilterEnabled(enabled: boolean): void {
  const config = loadFilterConfig();
  config.enabled = enabled;
  saveFilterConfig(config);
}

export function setDefaultDeny(deny: boolean): void {
  const config = loadFilterConfig();
  config.defaultDeny = deny;
  saveFilterConfig(config);
}

export function getFilterStats(): {
  totalWhitelisted: number;
  whitelistedByType: Record<ContentType, number>;
  allowedCategories: AllowedCategory[];
  blockedKeywordsCount: number;
  enabled: boolean;
  defaultDeny: boolean;
} {
  const config = loadFilterConfig();
  
  const whitelistedByType: Record<ContentType, number> = {
    video: 0,
    playlist: 0,
    channel: 0,
  };
  
  for (const item of config.whitelist) {
    whitelistedByType[item.type]++;
  }

  return {
    totalWhitelisted: config.whitelist.length,
    whitelistedByType,
    allowedCategories: config.allowedCategories,
    blockedKeywordsCount: config.blockedKeywords.length,
    enabled: config.enabled,
    defaultDeny: config.defaultDeny,
  };
}