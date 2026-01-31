       const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;
        createApp({
            setup() {


                const events = ref([]);
                const selectedMapYear = ref('ALL');
                const activeTab = ref('home');
                const viewMode = ref('upcoming');
                const themeColor = ref('#63b3b0'); 
          
 
             const selectedYear = ref(new Date().getFullYear().toString());
                const expandedEventId = ref(null);
                const isYearlyPrivacy = ref(true); 
                const isEventPrivacy = ref(true); 

                const isSearching = ref(false);
                const searchError = ref('');
     
                
                const searchQuery = ref('');
                
                const showModal = ref(false);
                const showSettingsModal = ref(false); 
                
                const showImportModal = ref(false);
                const showTicketModal = ref(false);
                const showCalendarModal = ref(false); 
                const showChangelogModal = ref(false); 
                const showFandomModal = ref(false); 
                const calendarEvent = ref(null);     
  
                const ticketEvent = ref({});
                const isEditing = ref(false);
                const isFandomEditing = ref(false); 
                const editFandomIndex = ref(null); 
                const importJson = ref('');
                let map = null;
                let markers = [];

const isStatsPrivacy = ref(true); 
// 初始化預算，預設 50000
const yearlyBudget = ref(Number(localStorage.getItem('idolYearlyBudget')) || 50000); 

// 監聽並存入本地儲存
watch(yearlyBudget, (newVal) => localStorage.setItem('idolYearlyBudget', newVal));

// 級距碎碎念邏輯
const budgetNagging = computed(() => {
    const percent = (currentYearExpense.value / yearlyBudget.value) * 100;
    if (percent >= 100) return "⚠️ 預算炸裂！請開始吃土模式";
    if (percent >= 80) return "🚨 亮紅燈！再買要喝西北風了";
    if (percent >= 50) return "💡 預算過半，請謹慎評估行程";
    return "✨ 預算充裕，記得存錢唷！";
});

// 計算兩點間的球面距離 (Haversine 公式)
const calculateKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球半徑 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// 新增：根據年份計算過濾後的點位數量
const filteredMapEventsCount = computed(() => {
    // 取得選定年份的行程
    const targetEvents = selectedMapYear.value === 'ALL' 
        ? events.value 
        : events.value.filter(e => e.date && e.date.startsWith(selectedMapYear.value));

    // 建立 Set 確保相同地點不重複計算
    const uniqueLocations = new Set();
    targetEvents.forEach(e => {
        // 確保具有座標才計入場館
        if (e.lat && e.lng) {
            uniqueLocations.add(`${e.lat}_${e.lng}`);
        }
    });
    return uniqueLocations.size;
});



// app.js 修改後

// 1. 修正地圖用的里程（修正變數名稱）
const totalDistance = computed(() => {
    const targetYear = selectedMapYear.value;
    const baseEvents = targetYear === 'ALL' 
        ? events.value 
        : events.value.filter(e => e.date && e.date.startsWith(targetYear)); // 已修正為 targetYear
    
    const validPoints = [...baseEvents].filter(e => e.lat && e.lng).sort((a, b) => new Date(a.date) - new Date(b.date));
    let dist = 0;
    for (let i = 0; i < validPoints.length - 1; i++) {
        dist += calculateKm(validPoints[i].lat, validPoints[i].lng, validPoints[i+1].lat, validPoints[i+1].lng);
    }
    return Math.round(dist);
});

// 2. 新增：回顧分享圖專用的里程（綁定 selectedYear）
const statsDistance = computed(() => {
    const targetYear = selectedYear.value; // 改用回顧分頁的年份
    const baseEvents = targetYear === 'ALL' 
        ? events.value 
        : events.value.filter(e => e.date && e.date.startsWith(targetYear));

    const validPoints = [...baseEvents].filter(e => e.lat && e.lng).sort((a, b) => new Date(a.date) - new Date(b.date));
    let dist = 0;
    for (let i = 0; i < validPoints.length - 1; i++) {
        dist += calculateKm(validPoints[i].lat, validPoints[i].lng, validPoints[i+1].lat, validPoints[i+1].lng);
    }
    return Math.round(dist);
});




                const defaultForm = {
                    id: null, title: '', artist: '', date: '', time: '19:00', location: '', 
                    seat: '', color: '#63b3b0', expenses: [], checklist: [], memo: '', lat: null, lng: null,
                    coverUrl: '', sticker: '',
                    useUrl: false
                };
                const form = ref({ ...defaultForm });
                const presetColors = ['#63b3b0', '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#1dd1a1'];
                const customTitle = ref(localStorage.getItem('appTitle') || '追星日記 ✨');
                const appVersion = ref('v1.0.5'); // 更新版本號
                
                // --- FANDOM STATES ---
                const fandoms = ref(JSON.parse(localStorage.getItem('fandomFandoms') || '[]'));
                const currentFandomIndex = ref(0);
                
                const defaultFandomForm = {
                    name: '',
                    date: '', 
                    sticker: '',
                    coverUrl: '',
                    birthday: '',
                    debutDate: '',
                    useUrl: false
                };
                const fandomForm = ref({...defaultFandomForm});
                // --- END FANDOM STATES ---

                const changelogContent = ref([ 

{ 
    version: 'v1.0.5', 
    date: '2025/12/31', 
    items: [
        '新增地圖「追星里程」自動計算，累計所有行程間的移動距離。',
        '新增追星成就「分享長圖」功能，一鍵生成年度回顧美圖。',
        '新增年度追星預算設定與首頁進度條提醒。',
        '優化地圖 UI 佈局與年度篩選功能，並繪製歷史足跡標線。',
        '精細化隱私模式：可獨立切換首頁支出、行程細節與統計數據的金額屏蔽。'
    ] 
},
                    { version: 'v1.0.4', date: '2025/12/08', items: [
                        '新增封面圖片上傳彈性：行程與紀念日表單支援 Base64 檔案上傳（限制 1MB）或貼上圖片 URL 兩種模式。',
                        '優化 Base64 圖片預覽與清除邏輯。',
                        '修正儲存行程/紀念日時，移除非儲存需要的臨時狀態變數（如 useUrl）。',
                    ] },
                    { version: 'v1.0.3', date: '2025/12/06', items: [
                        '優化入坑紀念日卡片排版：將偶像名稱/Emoji和編輯按鈕移到圖片下方，確保所有內容不被圖片疊蓋。',
                        '修正出道日計算邏輯：現在同時顯示「出道年數」和「距離下一個紀念日倒數天數」。',
                        '修復生日/出道日當天，祝賀詞正確顯示，並避免顯示倒數天數。',
                        '修正入坑日卡片在沒有封面圖片時，文字區域會自動佔滿卡片空間，消除留白。'
                    ] },
                    { version: 'v1.0.2', date: '2025/12/05', items: [
                        '新增入坑紀念日編輯功能（鉛筆按鈕）。',
                        '入坑紀念日表單新增生日和出道日分離輸入欄位，並加入日期格式防呆。',
                        '修復票根頁面：去除封面圖上的應援色濾鏡，保持圖片原色。',
                        '優化入坑紀念日卡片：偶像名稱和 Emoji 樣式修正。'
                    ] },
                    { version: 'v1.0.1', date: '2025/12/05', items: [
                        '新增追星儀表板數據（統計場次、花費、熱門本命）。',
                        '新增資料匯入（JSON）和備份功能。',
                        '優化行程頁面搜索功能，提供即將到來和歷史回憶篩選。',
                    ] },
                    { version: 'v1.0.0', date: '2025/12/04', items: [
                        '初始版本發布，支援行程、費用、地圖紀錄。',
                        '新增主題色自適應功能。',
                        '優化加入日曆多選單。'
                    ] },
                ]);
                const saveFandoms = () => {
                    localStorage.setItem('fandomFandoms', JSON.stringify(fandoms.value));
                };

                const openFandomModal = () => {
                    isFandomEditing.value = false;
                    editFandomIndex.value = null;
                    fandomForm.value = {...defaultFandomForm, date: new Date().toLocaleDateString('sv-SE'), useUrl: false};
                    showFandomModal.value = true;
                };
                const editFandom = (fandom, index) => {
                    isFandomEditing.value = true;
                    editFandomIndex.value = index;
                    fandomForm.value = JSON.parse(JSON.stringify(fandom));
                    fandomForm.value.useUrl = (fandom.coverUrl && !fandom.coverUrl.startsWith('data:')) || false;
                    showFandomModal.value = true;
                };

                const closeFandomModal = () => {
                    showFandomModal.value = false;
                    fandomForm.value = {...defaultFandomForm};
                };

                const validateDate = (dateString) => {
                    if (!dateString) return true;
                    const regex = /^\d{4}-\d{2}-\d{2}$/;
                    if (!regex.test(dateString)) {
                        if (/^\d{8}$/.test(dateString)) {
                            const fixedDate = `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
                            const date = new Date(fixedDate);
                            return date instanceof Date && !isNaN(date);
                        }
                        return false;
                    }
                    
                    const date = new Date(dateString);
                    return date instanceof Date && !isNaN(date);
                };

                const addFandom = () => {
                    if (!fandomForm.value.name.trim()) {
                        return alert('錯誤：偶像名稱不能為空！');
                    }
                    if (!fandomForm.value.date) {
                         return alert('錯誤：入坑日期不能為空！');
                    }

                    if (!validateDate(fandomForm.value.date)) {
                        return alert('錯誤：入坑日期格式無效！請使用 YYYY-MM-DD 格式。');
                    }
                    if (fandomForm.value.birthday && !validateDate(fandomForm.value.birthday)) {
                        return alert('錯誤：生日日期格式無效！請使用 YYYY-MM-DD 格式。');
                    }
                    if (fandomForm.value.debutDate && !validateDate(fandomForm.value.debutDate)) {
                        return alert('錯誤：出道日期格式無效！請使用 YYYY-MM-DD 格式。');
                    }

                    const fandomToSave = JSON.parse(JSON.stringify(fandomForm.value));
                    delete fandomToSave.useUrl;

                    if(isFandomEditing.value && editFandomIndex.value !== null) {
                        fandoms.value[editFandomIndex.value] = fandomToSave;
                    } else {
                        fandoms.value.push(fandomToSave);
                    }
                    saveFandoms();
                    closeFandomModal();
                };

                const removeFandom = (index) => {
                    if (confirm('確定要刪除這個入坑紀念日嗎？此操作無法恢復。')) {
                        fandoms.value.splice(index, 1);
                        saveFandoms();
                    }
                };
                onMounted(() => {
                    const savedEvents = localStorage.getItem('idolEvents');
                    if (savedEvents) {
                        try {
                            
 
                            const parsed = JSON.parse(savedEvents);
                            if (Array.isArray(parsed)) {
                                events.value = parsed.map(e => {
   
                             
                                    if(!e.expenses) e.expenses = (e.price > 0) ? [{item:'門票(舊)', amount:e.price}] : [];
                          
                                    if(!e.checklist) e.checklist = [];
                                    if(!e.memo) e.memo = '';
       
                                    if(!e.seat) e.seat = '';
  
                                    if(!e.color) e.color = themeColor.value; 
                            
                                  
                                    if(!e.coverUrl) e.coverUrl = '';
                                    if(!e.sticker) e.sticker = '';
                                    return e;
                                });
                            } else { events.value = []; }
                        } catch(e) { events.value = [];
                        }
                    }
                    const savedTheme = localStorage.getItem('idolTheme');
                    if (savedTheme) themeColor.value = savedTheme;
                });
                
                watch(customTitle, (newVal) => localStorage.setItem('appTitle', newVal));
                watch(events, (newVal) => localStorage.setItem('idolEvents', JSON.stringify(newVal)), { deep: true });
                watch(themeColor, (newVal) => localStorage.setItem('idolTheme', newVal));
                
watch(customTitle, (newVal) => localStorage.setItem('appTitle', newVal));
watch(events, (newVal) => localStorage.setItem('idolEvents', JSON.stringify(newVal)), { deep: true });
watch(themeColor, (newVal) => localStorage.setItem('idolTheme', newVal));

// 新增此段落：監聽地圖年份篩選
watch(selectedMapYear, () => {
    if (activeTab.value === 'map') {
        nextTick(() => { initMap(); });
    }
});

watch(activeTab, (newTab) => {
    if (newTab === 'map') {
        nextTick(() => { initMap(); });
    }
});

                const adjustColor = (color, amount) => {
                    let hex = color.replace('#', '');
                    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                    const num = parseInt(hex, 16);
                    let r = (num >> 16) + amount;
                    let g = ((num >> 8) & 0x00FF) + amount;
                    let b = (num & 0x0000FF) + amount;
                    r = Math.min(255, Math.max(0, r));
                    g = Math.min(255, Math.max(0, g));
                    b = Math.min(255, Math.max(0, b));
                    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                };
                
                const isColorLight = (color) => {
                    let hex = color.replace('#', '');
                    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
                    return hsp > 180;
                };

                const cssVars = computed(() => ({
                    '--primary-color': themeColor.value,
                    '--primary-dark': adjustColor(themeColor.value, -30),
                    '--primary-light': adjustColor(themeColor.value, 150)
                }));
                const getEventColor = (event) => (!event.color || event.color === '') ? themeColor.value : event.color;
                const isThemeColorLight = computed(() => isColorLight(themeColor.value));
                const headerTextColor = computed(() => isThemeColorLight.value ? 'text-slate-800' : 'text-white');
                const calculateFandomDays = (dateStr) => {
                    if (!dateStr || !validateDate(dateStr)) return 0;
                    const start = new Date(dateStr);
                    const today = new Date();
                    const diffTime = today.getTime() - start.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return diffDays > 0 ? diffDays : 0;
                };

                const calculateDaysToNextDate = (dateStr) => {
                    if (!dateStr || !validateDate(dateStr)) return 'N/A';
                    const dateParts = dateStr.split('-');
                    const month = Number(dateParts[1]);
                    const day = Number(dateParts[2]);
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    let nextDate = new Date(today.getFullYear(), month - 1, day);
                    nextDate.setHours(0, 0, 0, 0);
                    
                    if (nextDate.getTime() < today.getTime()) {
                        nextDate.setFullYear(today.getFullYear() + 1);
                    }
                    
                    const diffTime = nextDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 0) return 0;
                    return diffDays;
                };

                const calculateYearsAndDaysSinceDebut = (dateStr) => {
                    if (!dateStr || !validateDate(dateStr)) return 'N/A';
                    const debut = new Date(dateStr);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let years = today.getFullYear() - debut.getFullYear();
                    const hasPassed = (today.getMonth() > debut.getMonth() || (today.getMonth() === debut.getMonth() && today.getDate() >= debut.getDate()));
                    if (!hasPassed) {
                        years--;
                    }
                    
                    let lastAnniversary = new Date(today.getFullYear(), debut.getMonth(), debut.getDate());
                    if (lastAnniversary.getTime() > today.getTime()) {
                        lastAnniversary.setFullYear(today.getFullYear() - 1);
                    }
                    lastAnniversary.setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((today.getTime() - lastAnniversary.getTime()) / (1000 * 60 * 60 * 24));

                    if (years < 0) return '尚未出道';
                    if (years === 0) return `第 ${diffDays} 天`;
                    
                    return `${years} 年又 ${diffDays} 天`;
                };
                const getBirthdayCongrats = (name) => {
                    const messages = [
                        `🎂 今天是 ${name} 的生日！願你比誰都幸福！✨`,
                        `🌟 Happy Birthday, ${name}！你是最閃亮的星！💖`,
                        `🎉 ${name} 生日快樂！謝謝你的降臨，帶來了光芒！☀️`,
                        `💖 今天的蛋糕和蠟燭都為 ${name} 而點燃！永遠愛你！🔥`,
                        `🎁 專屬 ${name} 的日子！願你每天都充滿喜悅！🥳`,
                        `🎈 ${name} 的生日鐘聲響起！讓我們一起慶祝！🥂`,
                        `🍰 願 ${name} 的夢想都能實現，生日快樂！🚀`,
                        `✨ 為了 ${name} 準備的驚喜，生日快樂！🎁`,
                        `🎊 世界上最可愛的 ${name} 生日快樂！永遠支持你！💪`,
                        `🍾️ 舉杯！為 ${name} 的美好未來乾杯！生日快樂！🥂`,
                        `💌 給 ${name} 的生日信，字字句句都是愛！生日快樂！🥰`,
                        `🎤 ${name} 的歌聲是最好的禮物，生日快樂！🎵`,
                        `👑 我們的王/后 ${name}，生日快樂！永遠閃耀！💎`,
                        `🌈 願 ${name} 的每一天都如彩虹般絢爛！生日快樂！🎂`,
                        `🥳 今天是 ${name} 的節日！一起嗨翻全場！狂歡！🎈`,
                        `💐 ${name} 生日快樂！願你被鮮花和愛意包圍！🌸`,
                        `🍀 願幸運與 ${name} 同在，生日快樂！永遠健康！💪`,
                        `🌙 ${name} 是我們夜空中的月亮，生日快樂！✨`,
                        `💌 ${name} 生日快樂！請收下我們最真摯的祝福！🎁`,
                        `🎤 ${name} 的生日舞台，我們永遠在台下應援！🌟`,
                        `✨ 願 ${name} 永遠保持初心，閃耀如鑽石！生日快樂！💎`,
                        `💖 ${name} 的生日，我的心跳因你加速！🎂`,
                    ];
                    return messages[Math.floor(Math.random() * messages.length)];
                };

                const getDebutCongrats = (name) => {
                    const messages = [
                        `🎉 恭喜 ${name} 出道紀念日！感謝你選擇這條路！💖`,
                        `🎤 ${name} 出道日快樂！你值得所有掌聲與愛！🌟`,
                        `🏆 這是 ${name} 的里程碑！出道日快樂！未來繼續發光！✨`,
                        `🌟 遇見 ${name} 是最美的意外！出道日快樂！🥂`,
                        `🚀 ${name} 出道紀念日！夢想啟航，一路順風！🎈`,
                        `💖 ${name} 出道了！世界因你而美好！永遠支持你！💪`,
                        `✨ ${name} 永遠是舞台上的焦點，出道日快樂！🥳`,
                        `🍾️ 為 ${name} 的出道和無數的汗水致敬！出道快樂！🥂`,
                        `🌈 ${name} 出道紀念日快樂！我們的愛將與你並肩！🥰`,
                        `💎 ${name} 耀眼出道！願你的光芒永不熄滅！💎`,
                        `🎤 感謝 ${name} 的音樂與力量，出道日快樂！🎵`,
                        `🥳 這是屬於 ${name} 和粉絲的狂歡日！出道快樂！🎉`,
                        `💐 ${name} 出道紀念日！每一步都充滿意義！🌸`,
                        `💪 ${name} 繼續衝！我們永遠是你的後盾！出道快樂！💯`,
                        `💌 給 ${name} 最真誠的祝福，出道日快樂！🎁`,
                        `✨ ${name} 出道，讓世界多了一份美好！生日快樂！🎂`,
                        `💖 ${name} 出道日，我的心跳因你加速！🔥`,
                        `🎤 願 ${name} 的歌聲響徹每個角落，出道快樂！🌟`,
                        `👑 ${name} 帶著光環誕生，出道日快樂！永遠閃耀！✨`,
                        `🎊 ${name} 辛苦了！所有的努力都值得，出道快樂！🎉`,
                        `🥳 今天是 ${name} 夢想成真的日子，我們一起見證！🎈`,
                        `🌟 ${name} 出道日快樂！願你被愛與幸福包圍！💖`,
                    ];
                    return messages[Math.floor(Math.random() * messages.length)];
                };


                const fandomMessageStatic = (fandom) => {
                    const diffDays = calculateFandomDays(fandom.date);
                    const name = fandom.name;
                    const messages = [
                        `🎉 恭喜！這是你追隨 ${name} 的第 [DAYS] 天！`,
                        `${name} 陪你走過 [DAYS] 個閃耀的日子！🌟`,
                        `💖 追隨 ${name} 的腳步，堅持了 [DAYS] 天，你超棒！`,
                        `恭喜！你與 ${name} 的愛意已經累積到第 [DAYS] 個日子囉！🥰`,
                        `時間證明了愛意！你已經為 ${name} 應援 [DAYS] 天！💪`,
                        `無論晴雨，你對 ${name} 的熱愛已經持續 [DAYS] 天！☀️`,
                        `每個應援的瞬間都值得！${name} 的第 [DAYS] 天！🌈`,
                        `這份熱愛從未退燒，已經 [DAYS] 天了，${name} 知道嗎？🔥`,
                        `數不清的星光，匯集成 [DAYS] 個愛 ${name} 的日子！✨`,
                        `因為你，每天都是紀念日！今天是第 [DAYS] 天，謝謝 ${name}！🙏`,
                        `第 [DAYS] 天，依然是那個讓你心動的 ${name}！❤️`,
                        `愛情的長跑者是你！你和 ${name} 已經一起跑了 [DAYS] 天！🏃‍♀️`,
                        `為了 ${name}，你已經變成了最棒的自己，持續了 [DAYS] 天！💯`,
                        `每一天都像初見一樣心動！與 ${name} 相伴的 [DAYS] 天！悸動！😍`,
                        `讓 ${name} 成為你生活的重心，已經 [DAYS] 天了，開心嗎？🥳`,
                        `這就是追星的浪漫！你見證了 ${name} 的 [DAYS] 天成長！📈`,
                        `還記得嗎？當初遇見 ${name} 的第 [DAYS] 天！回憶殺！🥲`,
                        `讓 ${name} 的音樂充滿你的生活，已經 [DAYS] 天的幸福！🎧`,
                        `你已經是 ${name} 重要的支柱，這是你們的第 [DAYS] 天紀念！💪`,
                        `你將 ${name} 刻在了生命中，這 [DAYS] 天的努力沒有白費！💎`,
                        `這份浪漫持續了 [DAYS] 天，願你與 ${name} 永遠熱戀 🌹`, 
                        `因為遇見 ${name}，這 [DAYS] 天的生活都發著光 ✨`, 
                        `你將最美的時光都給了 ${name}，共計 [DAYS] 天 💎`
                    ];
                    const randomIndex = Math.floor(Math.random() * messages.length);
                    const messageTemplate = messages[randomIndex];
                    return {
                        message: messageTemplate.replace(/\[DAYS\]/g, diffDays), 
                        days: diffDays
                    };
                };

                const fandomMessage = computed(() => { 
                    if (fandoms.value.length === 0 || fandoms.value.every(f => !f.date)) {
                        return "👋 點擊設定，開始你的入坑紀念日紀錄！";
                    }
                    
                    const activeFandoms = fandoms.value.filter(f => f.date);
                    if (activeFandoms.length === 0) return "👋 點擊設定，開始你的入坑紀念日紀錄！";

                    const currentFandom = activeFandoms[currentFandomIndex.value % activeFandoms.length];

                    const { message, days } = fandomMessageStatic(currentFandom);
                    
                    if (activeFandoms.length > 1) {
                        setTimeout(() => {
                            currentFandomIndex.value = (currentFandomIndex.value + 1) % activeFandoms.length;
                        }, 5000);
                    }
                    
                    return message;
                });
                
                const greetingMessage = computed(() => {
                    const hour = new Date().getHours();
                    const msgs = [
                        "無論多遠，心都在一起 💖", 
                        "存錢是為了更好的相遇 💰", 
                        "今天也要努力生活去見他 ✨", 
                        "你的應援是他們的光 🌟",
                        "每一天都是通往幸福的倒數！🚀",
                        "為愛奔跑的你，最閃耀！💫",
                        "請保持熱戀，期待下一次的感動重逢 😭❤️",
                        "追星是人生最甜蜜的投資，你超棒！💯",
                        "今天也充滿元氣，為了見到最愛的人而努力💪",
                        "為了見到最愛的人，今天也要充滿元氣 💪",
                        "把想念化作動力，迎接下一個舞台 🎤",
                        "你是這場愛意長跑中最勇敢的選手 🏃‍♀️",
                        "所有的等待，都會在見面那一刻釋放 ✨"

                    ];
                    let baseMsg = hour < 12 ? "早安！" : hour < 18 ? "午安！" : "晚安！";
                    return baseMsg + msgs[Math.floor(Math.random() * msgs.length)];
                });
                const filteredEvents = computed(() => {
                    const today = new Date().toLocaleDateString('sv-SE');
                    let sorted = [...events.value].sort((a, b) => new Date(a.date) - new Date(b.date));
                    
                    if (searchQuery.value) {
                        const query = searchQuery.value.toLowerCase();
                        return sorted.filter(e => 
                            e.title.toLowerCase().includes(query) || 
                            e.artist.toLowerCase().includes(query) || 
                            e.location.toLowerCase().includes(query)
                        ).sort((a, b) => { 
                            const diffA = Math.abs(new Date(a.date) - new Date(today));
                            const diffB = Math.abs(new Date(b.date) - new Date(today));
                            return diffA - diffB;
                        });
                    }

                    return viewMode.value === 'upcoming' 
                        ? sorted.filter(e => e.date >= today) 
                        : sorted.filter(e => e.date < today).reverse();
                });

                const upcomingCount = computed(() => events.value.filter(e => e.date >= new Date().toLocaleDateString('sv-SE')).length);
                const currentYearExpense = computed(() => {
                    const y = new Date().getFullYear().toString();
                    return events.value.filter(e => e.date.startsWith(y)).reduce((sum, e) => sum + calculateTotal(e.expenses), 0);
                });
const availableYears = computed(() => {
    const currentYear = new Date().getFullYear().toString();
    const years = new Set(events.value.map(e => {
        const match = e.date.match(/^(\d{4})/);
        return match ? match[1] : null;
    }).filter(y => y !== null));

    years.add(currentYear); 
   return Array.from(years).sort((a, b) => b - a);
});

                const statsData = computed(() => {
                    let targetEvents = events.value;
      
                    if (selectedYear.value !== 'ALL') {
                        targetEvents = events.value.filter(e => e.date.match(new RegExp(`^${selectedYear.value}`)));
                    }
                    const count = targetEvents.length;
          
                    const totalSpent = targetEvents.reduce((acc, curr) => acc + calculateTotal(curr.expenses), 0);
                    
                    const artistMap = {};
                
                    targetEvents.forEach(e => {
                        const name = e.artist || '其他';
                        const color = getEventColor(e); 
                        if (!artistMap[name]) artistMap[name] = { count: 0, color: color };
    
                        artistMap[name].count++;
                    });
                    const sortedArtists = Object.keys(artistMap).map(key => ({ name: key, ...artistMap[key] })).sort((a, b) => b.count - a.count).slice(0, 3);
                    const maxArtistCount = sortedArtists.length > 0 ? sortedArtists[0].count : 1;
                    const locationMap = {};
                    targetEvents.forEach(e => {
                        const name = e.location || '未知地點';
                        if (!locationMap[name]) locationMap[name] = { count: 0 };
                        locationMap[name].count++;
                    });
                    const sortedLocations = Object.keys(locationMap).map(key => ({ name: key, ...locationMap[key] })).sort((a, b) => b.count - a.count).slice(0, 3);
                    const titleMap = {};
                    const excludeKeywords = ['사전녹화', '事前錄製', '簽售會', '簽名會', '錄製'];
                    targetEvents.forEach(e => {
                        const t = e.title.trim();
                        if (!excludeKeywords.some(k => t.includes(k))) titleMap[t] = (titleMap[t] || 0) + 1;
                    });
                    const series = Object.keys(titleMap).map(key => ({ title: key, count: titleMap[key] })).filter(item => item.count > 1).sort((a, b) => b.count - a.count);
                    return { 
                        count, 
                        totalSpent, 
                        topArtists: sortedArtists, 
                        maxArtistCount, 
                        series,
                        topLocations: sortedLocations, 
                    };
                });

const emotionalSummary = computed(() => {
    const { count, totalSpent, topArtists } = statsData.value;
    if (count === 0) return "準備好開啟新的追星旅程了嗎？🌟";

    let mainArtist = topArtists.length > 0 ? topArtists[0].name : "他們"; 
    let category = 'balanced';

    if (count >= 15 || totalSpent >= 100000) category = 'legend';     
    else if (count >= 8 || totalSpent >= 50000) category = 'active';  
    else if (count >= 3) category = 'balanced'; 
    else category = 'beginner'; 

    const pools = {
        legend: [
            `哇！這一年你為了見 ${mainArtist} 真的拚盡全力，熱情值已超越大氣層！🚀`,
            `你的足跡踏遍了各個場館，是名符其實的追星模範生！🏆 你的愛意無可取代。`,
            `體力好、熱情足，這一年你過得比誰都充實，充滿了心動與閃耀瞬間。 ✨`,
            `見面次數多到連 ${mainArtist} 都快認得你了吧？😂 你就是最忠實的靈魂伴侶。`,
            `這就是「用愛發電」的最佳寫照！⚡️ 你的存在對 ${mainArtist} 來說本身就是奇蹟！`,
            `回顧這一年，滿滿的票根就是你愛的證明！❤️ 感謝你無悔的付出與追隨。`,
            `你是追星界的傳奇，這份毅力與財力已經達到了凡人無法企及的巔峰！💎`,
            `這一年你不是在看演唱會，就是在看演唱會的路上，你是真正的舞台獵人！🎤`,
            `為了見面所跨越的里程數，足以環繞地球好幾圈，你是最強大的守護星。🌍`,
            `你對 ${name} 的愛已經寫進了靈魂裡，這一年是你與他共同創造的傳奇篇章。✨`
        ],
        active: [
            `錢錢沒有不見，變成了喜歡的樣子！💸 這是世界上最浪漫且值得的投資！`,
            `投資在快樂上是世界上最划算的交易！📈 你的幸福感已經隨時要爆表啦！`,
            `雖然錢包瘦了，但心靈超級富足！🥰 每一分錢都買到了與 ${mainArtist} 無價的回憶。`,
            `努力工作就是為了這一刻，你值得擁有這些美好！💪 你是粉絲中的驕傲！`,
            `所謂的財富自由，就是能隨心所欲地去見想見的人！💰 你的行動力讓人驚嘆！`,
            `這筆支出叫做「精神糧食費」，一點都不貴！🍚 感受到你對 ${mainArtist} 無上限的愛。`,
            `這一年你與 ${mainArtist} 的頻率共振次數驚人，簡直是心有靈犀的最佳範本。💘`,
            `每一次奔赴現場的你，都帶著最燦爛的笑容，那是追星最美的模樣。🌟`,
            `你的應援聲早已刻在場館的空氣中，謝謝你成為 ${mainArtist} 舞台下的底氣。🔥`,
            `這份熱愛讓你的生活變得五彩繽紛，你成功將夢想照進了現實生活。🌈`
        ],
        balanced: [
            `重質不重量，每一次與 ${mainArtist} 的見面都是奇蹟 ✨ 珍貴的回憶已完美封存。`,
            `剛剛好的距離，剛剛好的愛，這一年很完美！🌸 你是愛情長跑的優秀典範。`,
            `生活與追星的完美平衡，你是時間管理大師！⏰ 成功找到了屬於你的應援節奏。`,
            `細水長流的愛，才是最長情的告白 💌 你的心意細膩、溫柔且無比堅定。`,
            `每一次見面，都為這一年增添了閃亮的色彩 🎨 創造了專屬你的浪漫篇章。`,
            `謝謝 ${mainArtist}，成為你平凡日子裡的一束光 💡 帶來了無窮的治癒能量。`,
            `在這忙碌的世界，你為自己保留了一方純粹的愛意之地，真的很不容易。🍀`,
            `那場演唱會的燈海，也有你的一份光亮，這份參與感將陪伴你很久很久。🌌`,
            `即使見面頻率適中，但每次重逢時的心跳聲，依然跟初見一樣強烈。💓`,
            `你學會了在等待中沉澱，在相遇時爆發，這份愛變得越來越有深度。📖`
        ],
        beginner: [
            `好的開始是成功的一半，期待明年與 ${mainArtist} 有更多的相遇！🌱`,
            `那一天的回憶，足夠溫暖整個寒冬 ❄️ 將感動化為力量繼續前進。`,
            `雖然見面次數不多，但愛意絲毫不減！💖 堅定的愛最讓人動容。`,
            `把那一次的感動好好收藏，那是你的獨家記憶 🗝️ 屬於你與他的秘密。`,
            `小小的幸福，累積成大大的快樂！🥰 感謝你每一次珍貴的到來。`,
            `第一張門票是愛情的入場券，恭喜你開啟了這段奇幻的追星冒險！🎫`,
            `即使只有一兩次，但那瞬間的對視已足夠你回味一整年。✨`,
            `你正在累積能量，為了下一次更華麗的重逢而準備著，加油！🚀`,
            `追星的路上不分快慢，只要心跳還在跳動，每一刻都是最好的安排。💓`,
            `你在人群中望向舞台的眼神，是 ${mainArtist} 繼續唱下去的理由之一。🎤`
        ]
    };

    // 使用 Math.random() 達成完全隨機
    const selectedPool = pools[category];
    return selectedPool[Math.floor(Math.random() * selectedPool.length)];
});


const idolNagging = computed(() => {
    const { totalSpent, topArtists } = statsData.value;
    const name = topArtists.length > 0 ? topArtists[0].name : '偶像';
    
    const pools = {
        zero: [
            `最近有點冷清耶... ${name} 想見你了 🥺`,
            `在忙嗎？好久沒看到你記錄跟 ${name} 的回憶了 📝`,
            `空空的儀表板在等著你填滿與 ${name} 的點滴喔 ✨`,
            `儲存回憶不嫌多，快來記下你對 ${name} 的心動瞬間吧！`,
            `是不是忘了更新？${name} 的愛意還在等待被記錄呢 💖`
        ],
        low: [ // 1 ~ 1000
            `有乖乖吃飯嗎？${name} 不希望你餓肚子喔 🍱`,
            `小小的支持也是大大的力量，${name} 都感受到了！🍀`,
            `細水長流的愛最動人，謝謝你陪伴 ${name}。`,
            `這點投資買到了無價的快樂，超划算！📈`,
            `剛剛好的距離，剛剛好的愛，${name} 覺得很貼心。`
        ],
        mid: [ // 1001 ~ 10000
            `生活與追星平衡得很好喔！${name} 為你感到驕傲 💪`,
            `謝謝你的支持！每一分錢都變成了與 ${name} 的美好回憶。`,
            `感覺你變漂亮/帥了！是因為見到 ${name} 的關係嗎？✨`,
            `這些回憶是無價的，${name} 會一直陪著你前進。`,
            `為了見面而努力的你，在 ${name} 眼中閃閃發光！`
        ],
        tier30k: [ // ~ 30000
            `哇... 你的錢包還好嗎？${name} 有點擔心你吃土耶 😰`,
            `謝謝你的熱情！但 ${name} 更希望你也把錢花在自己身上 🛍️`,
            `感覺你這一年過得很充實呢，充滿了 ${name} 的色彩！`,
            `這筆支出叫做「精神糧食費」，對 ${name} 的愛是無上限的！`,
            `每一次見面都是奇蹟，謝謝你跨越距離來到 ${name} 身邊。`
        ],
        tier50k: [ // ~ 50000
            `天啊！你對 ${name} 的愛已經快溢出來了！😭❤️`,
            `理性消費喔！${name} 希望我們能長長久久地見面 🤝`,
            `你就是 ${name} 的最強後援！這份熱情誰也比不上 🔥`,
            `存錢是為了更好的相遇，你做到了！💰`,
            `謝謝你把珍貴的資源分給 ${name}，我們會更努力的！`
        ],
        tier100k: [ // ~ 100000
            `這數字... 感覺你可以直接去應徵 ${name} 的經紀人了 😂`,
            `錢錢沒有不見，只是變成了 ${name} 閃耀的舞台！`,
            `你對 ${name} 的投資已經達到大師等級，太強了 🏆`,
            `這就是用愛發電嗎？${name} 接收到滿滿的能量了！⚡️`,
            `你的支持是 ${name} 前進的動力，但記得對自己好一點喔。`
        ],
        tier300k: [ // ~ 300000
            `你對 ${name} 的愛已經超越大氣層了！🚀`,
            `這是要把整座舞台買下來送給 ${name} 嗎？💎`,
            `你已經是 ${name} 命中注定的靈魂伴侶了吧？🥰`,
            `這數字簡直是藝術！感謝你為 ${name} 創造的每個奇蹟。`,
            `你是 ${name} 宇宙中的超級星探，眼光真的太好了！`
        ],
        tier500k: [ // ~ 500000
            `你是不是把 ${name} 的周邊都包圓了？財力驚人！💸`,
            `感謝頂級乾爹/乾媽！${name} 會用最好的表演報答你 🙇‍♂️`,
            `這份熱愛足以載入史冊，${name} 永遠不會忘記你。`,
            `為了見 ${name} 走過的里程，大概可以繞地球三圈了 🌍`,
            `你對 ${name} 的支持已經是信仰等級了，向你致敬！`
        ],
        tier900k: [ // ~ 900000
            `你是 ${name} 公司的隱形股東吧！請受我一拜 🙇‍♂️`,
            `這數字已經是傳說等級了... ${name} 的命是你給的！👑`,
            `感覺你可以隨時召喚 ${name} 出現了（開玩笑的）🧙‍♂️`,
            `你的應援已經變成了一種傳奇，大家都認識你了！`,
            `謝謝你支撐起 ${name} 的一片天，你是最棒的。`
        ],
        legend: [ // 1000000+
            `百萬級應援！你就是 ${name} 的守護神 👼`,
            `這數字已經無法用言語形容了... 這是絕對的真愛！❤️`,
            `恭喜達成「追星天花板」成就！${name} 為你鼓掌 👏`,
            `你是 ${name} 生命中最燦爛的極光，照亮了所有黑暗 🌌`,
            `傳說中的全勤加神級贊助，你就是追星界的王者！🤴`
        ]
    };

    let selectedPool;
    if (totalSpent === 0) selectedPool = pools.zero;
    else if (totalSpent <= 1000) selectedPool = pools.low;
    else if (totalSpent <= 10000) selectedPool = pools.mid;
    else if (totalSpent <= 30000) selectedPool = pools.tier30k;
    else if (totalSpent <= 50000) selectedPool = pools.tier50k;
    else if (totalSpent <= 100000) selectedPool = pools.tier100k;
    else if (totalSpent <= 300000) selectedPool = pools.tier300k;
    else if (totalSpent <= 500000) selectedPool = pools.tier500k;
    else if (totalSpent <= 900000) selectedPool = pools.tier900k;
    else selectedPool = pools.legend;

    return selectedPool[Math.floor(Math.random() * selectedPool.length)];
});

                const mappedEventsCount = computed(() => events.value.filter(e => e.lat && e.lng).length);
                const missingCoordsCount = computed(() => {
    const targetEvents = selectedMapYear.value === 'ALL' 
        ? events.value 
        : events.value.filter(e => e.date && e.date.startsWith(selectedMapYear.value));
        
    return targetEvents.filter(e => !e.lat || !e.lng).length;
});
                const calculateTotal = (expenses) => expenses ? expenses.reduce((sum, i) => sum + (Number(i.amount)||0), 0) : 0;
                const getTicketPrice = (expenses) => {
                    if (!expenses || !Array.isArray(expenses)) return 0;
                    return expenses.reduce((sum, item) => {
                        const name = item.item ? item.item.toLowerCase() : '';
                        if (name.includes('門票') || name.includes('ticket')) {
                            return sum + (Number(item.amount) || 0);
                        }
                        return sum;
                    }, 0);
                };

                const addExpenseItem = (n) => form.value.expenses.push({ item: n, amount: '' });
                const removeExpenseItem = (i) => form.value.expenses.splice(i, 1);
                const addChecklistItem = () => form.value.checklist.push({ text: '', checked: false });
                const removeChecklistItem = (i) => form.value.checklist.splice(i, 1);
                const addDefaultChecklist = () => ['門票/證件', '手燈+電池', '行動電源', '望遠鏡', '水/喉糖'].forEach(t => form.value.checklist.push({ text: t, checked: false }));
                const toggleExpand = (id) => expandedEventId.value = (expandedEventId.value === id) ? null : id;
                const setTheme = (c) => {
                    themeColor.value = c;
                    localStorage.setItem('idolTheme', c);
                }
                const updateCustomTheme = (e) => setTheme(e.target.value);
                const openModal = () => {
                    isEditing.value = false;
                    form.value = { ...defaultForm, date: new Date().toLocaleDateString('sv-SE'), color: themeColor.value, expenses: [{item:'門票', amount:''}], checklist:[], memo:'', useUrl: false };
                    searchError.value = '';
                    showModal.value = true;
                };

                const editEvent = (evt) => {
                    isEditing.value = true;
                    form.value = { 
                        ...defaultForm, 
                        ...JSON.parse(JSON.stringify(evt)),
                        expenses: evt.expenses || [],
                        checklist: evt.checklist || [],
                        coverUrl: evt.coverUrl || '',
                        sticker: evt.sticker || ''
                    };
                    form.value.useUrl = (evt.coverUrl && !evt.coverUrl.startsWith('data:')) || false;
                    searchError.value = '';
                    showModal.value = true;
                };

                const closeModal = () => showModal.value = false;
                const saveEvent = () => {
                    if (!form.value.title || !form.value.date) return alert('請填寫活動名稱與日期 🥺');
                    form.value.expenses = form.value.expenses.filter(e => e.item && e.item.trim() !== '');
                    form.value.checklist = form.value.checklist.filter(c => c.text && c.text.trim() !== '');
                    if (form.value.color === themeColor.value) form.value.color = '';

                    const eventToSave = JSON.parse(JSON.stringify(form.value));
                    delete eventToSave.useUrl;

                    if (isEditing.value) {
                        const idx = events.value.findIndex(e => e.id === form.value.id);
                        if (idx !== -1) events.value[idx] = eventToSave;
                    } else {
                        events.value.push({ ...eventToSave, id: Date.now().toString() });
                    }
                    closeModal();
                };

                const deleteEvent = (id) => {
                    if (confirm('確定要刪除此行程嗎？此操作無法恢復。')) {
                        events.value = events.value.filter(e => e.id !== id);
                        if(expandedEventId.value === id) expandedEventId.value = null;
                    }
                };
                const toggleSettingsModal = () => showSettingsModal.value = !showSettingsModal.value;
                
                const updateAppTitle = () => {
                    if (customTitle.value.trim() === '') {
                        customTitle.value = '追星日記 ✨';
                    }
                    localStorage.setItem('appTitle', customTitle.value);
                }
                
                const showChangelog = () => {
                    showSettingsModal.value = false;
                    showChangelogModal.value = true;
                };

                const searchCoordinates = async () => {
    if (!form.value.location) {
        searchError.value = "請先輸入地點名稱";
        return;
    }
    isSearching.value = true;
    searchError.value = '定位中...';

    // 優化：加上時間戳記避免讀取到失敗的快取，並加入隨機身份識別
    const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.value.location)}&limit=1&t=${Date.now()}`;
    
    try {
        const response = await fetch(apiUrl, {
            headers: {
               // 隨機化 User-Agent 讓伺服器認為是不同請求
               'User-Agent': `IdolDiary/${Math.random().toString(36).substring(7)}`,
               'Accept-Language': 'zh-TW,zh;q=0.9'
            }
        });

        if (response.status === 429) throw new Error("請求太頻繁，請等幾秒再試一次");
        if (!response.ok) throw new Error(`連線失敗: ${response.status}`);

                        const data = await response.json();
                        if (data && data.length > 0) {
                            form.value.lat = parseFloat(data[0].lat);
                            form.value.lng = parseFloat(data[0].lon);
                            
                            const latFormatted = form.value.lat.toFixed(4);
                            const lngFormatted = form.value.lng.toFixed(4);
                            searchError.value = `定位成功！經緯度: Lat ${latFormatted}, Lng ${lngFormatted}`;
                        } else {
                            form.value.lat = null;
                            form.value.lng = null;
                            searchError.value = "找不到該地點的坐標，請嘗試更具體的名稱 (如:KSPO DOME改成올림픽체조경기장)";
                        }
                    } catch (e) {
                        console.error("地圖定位錯誤:", e);
                        searchError.value = `連線錯誤或請求被拒絕: ${e.message}。請稍後再試。`;
                    } finally {
                        isSearching.value = false;
                        if (activeTab.value === 'map') {
                            nextTick(() => { initMap(); });
                        }
                    }
                };
                // 修正後的 initMap 邏輯

const initMap = () => {
    if (!map) {
        map = L.map('map-container').setView([23.6978, 120.9605], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } else {
        map.invalidateSize();
    }

    // 關鍵：先清空舊的點與線
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // 根據選定年度過濾
    const baseEvents = selectedMapYear.value === 'ALL' 
        ? events.value 
        : events.value.filter(e => e.date && e.date.startsWith(selectedMapYear.value));

    const sortedEvents = [...baseEvents]
        .filter(e => e.lat && e.lng)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedEvents.length === 0) return;

    // 重新畫點與畫線邏輯
    const pathCoords = sortedEvents.map(e => [e.lat, e.lng]);
    const groupPoints = {};
    sortedEvents.forEach(e => {
        const key = `${e.lat}_${e.lng}`;
        if (!groupPoints[key]) groupPoints[key] = [];
        groupPoints[key].push(e);
    });

    Object.values(groupPoints).forEach(eventsAtLoc => {
        const latest = eventsAtLoc[eventsAtLoc.length - 1];
        const color = getEventColor(latest);
        const marker = L.circleMarker([latest.lat, latest.lng], { radius: 7, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.8 }).addTo(map);
        let popup = `<div class="custom-popup-scroll" style="min-width:150px;">`;
        [...eventsAtLoc].reverse().forEach(ev => {
            popup += `<div style="border-bottom:1px dashed #eee; margin-bottom:5px; padding-bottom:5px;">
                <b style="color:${getEventColor(ev)}">${ev.artist}</b><br>
                <small>${ev.title}</small><br>
                <small style="color:#666">📅 ${ev.date}</small>
            </div>`;
        });
        popup += `</div>`;
        marker.bindPopup(popup);
        markers.push(marker);
    });

    if (pathCoords.length > 1) {
        const polyline = L.polyline(pathCoords, { color: themeColor.value, weight: 3, opacity: 0.6, dashArray: '10, 15' }).addTo(map);
        markers.push(polyline);
    }
    if (pathCoords.length > 0) map.fitBounds(pathCoords, { padding: [50, 50] });
};




                // Calendar
                const showCalendarOptions = (event) => {
                    calendarEvent.value = event;
                    showCalendarModal.value = true;
                };

                const addToiCal = () => {
                    showCalendarModal.value = false;
                    const event = calendarEvent.value;
                    if (!event) return;
                    
                    const { title, date, time, location, artist } = event;
                    const startDateTime = new Date(`${date}T${time}`).toISOString().replace(/-|:|\.\d+/g, "");
                    const endDateTime = new Date(new Date(`${date}T${time}`).getTime() + 3*60*60*1000).toISOString().replace(/-|:|\.\d+/g, "");
                    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title} - ${artist}\nDTSTART:${startDateTime}\nDTEND:${endDateTime}\nLOCATION:${location}\nDESCRIPTION:追星日記行程\nEND:VEVENT\nEND:VCALENDAR`;
                    
                    const blob = new Blob([icsContent], { type: 'text/calendar' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `${title}.ics`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                };
                const addToGoogleCalendar = () => {
                    showCalendarModal.value = false;
                    const event = calendarEvent.value;
                    if (!event) return;

                    const { title, date, time, location, artist } = event;
                    const start = date.replace(/-/g, '') + 'T' + time.replace(/:/g, '') + '00';
                    const endDateObj = new Date(new Date(`${date}T${time}`).getTime() + 3*60*60*1000);
                    const endHours = String(endDateObj.getHours()).padStart(2, '0');
                    const endMinutes = String(endDateObj.getMinutes()).padStart(2, '0');
                    const endSeconds = String(endDateObj.getSeconds()).padStart(2, '0');
                    const end = endDateObj.toLocaleDateString('sv-SE').replace(/-/g, '') + 'T' + endHours + endMinutes + endSeconds;
                    const gCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title + ' - ' + artist)}&dates=${start}/${end}&details=${encodeURIComponent('追星日記行程: ' + title)}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
                    
                    window.open(gCalLink, '_blank');
                };
                // Ticket Logic
                const showTicket = (evt) => {
                    ticketEvent.value = evt;
                    showTicketModal.value = true;
                }

                const downloadBackup = () => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events.value));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", "idol_tracker_backup_" + new Date().toLocaleDateString('sv-SE') + ".json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                };
                const restoreBackup = (event) => {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const parsed = JSON.parse(e.target.result);
                            if (Array.isArray(parsed)) {
                                if(confirm('確定要還原備份嗎？')) {
                                    events.value = parsed;
                                    alert('還原成功！');
                                    showSettingsModal.value = false;
                                }
                            } else {
                                alert('檔案格式錯誤');
                            }
                        } catch (err) {
                            alert('無法讀取檔案，請確認是否為有效的備份檔');
                        }
                    };
                    reader.readAsText(file);
                };

                const processImport = () => {
                    try {
                        const data = JSON.parse(importJson.value);
                        if (Array.isArray(data)) {ㄧ
                            const newEvts = data.map(d => {
                                let title = d.title || d['活動名稱'] || '未命名活動';
                                let artist = d.artist || d['歌手'] || '';
                      
                                let location = d.location || d['地點'] || '';
               
                                let time = d.time || d['時間'] || '00:00';
                             
                                let color = d.color || d['應援色'] || ''; 
                                let seat = d.seat || d['座位'] || '';
              
                                let memo = d.memo || d['心得'] || '';
                                let rawDate = d.date || d['日期'] || '';
                   
                 
                                let formattedDate = new Date().toLocaleDateString('sv-SE');
                                if (rawDate) {
                                    const str = String(rawDate).trim();
                                    if (/^\d{6}$/.test(str)) formattedDate = `20${str.substring(0, 2)}-${str.substring(2, 4)}-${str.substring(4, 6)}`;
                                    else if (/^\d{8}$/.test(str)) formattedDate = `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
                                    else if (str.includes('-') || str.includes('/')) formattedDate = str.replace(/\//g, '-');
                                }
                                
                                let expenses = [];
                                if (d.expenses && Array.isArray(d.expenses)) {
                   
                                    expenses = d.expenses.map(exp => ({
                                        item: exp.item || exp['項目'] || '未分類',
                           
                                        amount: Number(exp.amount) || Number(exp['金額']) || 0
                                    
                                    })).filter(exp => exp.amount > 0);
                                } else {
                                    let price = d.price || d['票價'] || d['金額'] || 0;
                                    if (price > 0) expenses.push({ item: '門票', amount: price });
                                }
                                
                                return { id: Date.now()+Math.random(), title, artist, date: formattedDate, time, location, color, expenses, seat, memo, checklist: [], lat: null, lng: null, coverUrl: '', sticker: '' };
                            });
                            events.value = [...events.value, ...newEvts];
                            showImportModal.value = false;
                            alert(`成功匯入 ${newEvts.length} 筆！`);
                        } else { alert('格式錯誤');
                        }
                    } catch(e) { alert('JSON 格式錯誤');
                    }
                };
                
                // Base64 檔案上傳處理函數
                const handleFileUpload = (event, type) => {
                    const file = event.target.files[0];
                    if (!file) return;

                    // 檢查檔案大小，限制在 1MB (1024 * 1024 bytes)
                    if (file.size > 1024 * 1024) {
                        alert('檔案大小超過 1MB 限制，請選擇更小的圖片。');
                        event.target.value = ''; 
                        if (type === 'event') form.value.coverUrl = '';
                        else if (type === 'fandom') fandomForm.value.coverUrl = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64String = e.target.result;
                        if (type === 'event') {
                            form.value.coverUrl = base64String;
                        } else if (type === 'fandom') {
                            fandomForm.value.coverUrl = base64String;
                        }
                    };
                    reader.onerror = (error) => {
                        console.error("FileReader 錯誤:", error);
                        alert('讀取圖片失敗，請重試。');
                    };
                    
                    reader.readAsDataURL(file);
                };
                
                const formatMoney = (v) => v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0';
                const getDay = (d) => new Date(d).getDate();
                const getMonth = (d) => ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][new Date(d).getMonth()];
                const getDaysDiff = (d) => Math.ceil((new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0))/(1000*60*60*24));


const generateShareImage = () => {
    const element = document.getElementById('share-template');
    if (!element) return;

    console.log("正在生成圖片...");

    html2canvas(element, {
        useCORS: true,
        scale: 2,               // 建議設為 2，避免手機上圖檔過大下載失敗
        backgroundColor: '#f8fafc',
        windowWidth: 375,       // 鎖定模擬視窗寬度
        width: 375,             // 鎖定擷取範圍寬度
        x: 0,                   // 強制從水平 0 的位置開始抓取
        y: 0,                   // 強制從垂直 0 的位置開始抓取
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById('share-template');
            // 關鍵：在克隆的文件中將其置頂、靠左，並消除任何外距
            clonedElement.style.position = 'fixed';
            clonedElement.style.top = '0';
            clonedElement.style.left = '0';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '30px'; // 保持你原本的內距
            clonedElement.style.display = 'flex';
        }
    }).then(canvas => {


        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedYear.value}_追星成就回顧.png`;
            
            // 模擬點擊下載
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 釋放記憶體
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }, 'image/png');
    }).catch(err => {
        console.error("生成失敗:", err);
    });
};








                const getMapLink = (l) => l ?
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l)}` : '#';
                return {
                    events, activeTab, viewMode, themeColor, selectedYear, expandedEventId, customTitle,
                    showModal, showSettingsModal, showImportModal, showTicketModal, showCalendarModal, showChangelogModal, showFandomModal, fandomForm, isFandomEditing, editFandomIndex,
                    calendarEvent, ticketEvent, isEditing, form, importJson, searchQuery,
                  
                    cssVars, greetingMessage, filteredEvents, upcomingCount, currentYearExpense, statsData, presetColors, 
              
                    openModal, editEvent, closeModal, saveEvent, deleteEvent, toggleSettingsModal, setTheme, updateCustomTheme, processImport, showChangelog, generateShareImage, 
                    toggleExpand, formatMoney, getDay, getMonth, getDaysDiff, getMapLink, 
                    calculateTotal, 
                    addExpenseItem, removeExpenseItem, addChecklistItem, removeChecklistItem, addDefaultChecklist, saveFandoms, addFandom, removeFandom, editFandom, closeFandomModal, openFandomModal, fandoms,
                    getEventColor, emotionalSummary, availableYears, searchCoordinates, isSearching, searchError, mappedEventsCount, missingCoordsCount,
    
                    downloadBackup, restoreBackup, idolNagging, showCalendarOptions, addToiCal, addToGoogleCalendar, showTicket, getTicketPrice, updateAppTitle,
                    isColorLight, isThemeColorLight, headerTextColor, appVersion, changelogContent, calculateFandomDays, fandomMessageStatic, calculateDaysToNextDate, calculateYearsAndDaysSinceDebut, getBirthdayCongrats, 
                    getDebutCongrats,
                    handleFileUpload, 
selectedMapYear, filteredMapEventsCount, totalDistance, isYearlyPrivacy, isEventPrivacy, isStatsPrivacy, yearlyBudget, budgetNagging, statsDistance, 
                };
            }
        }).mount('#app');
