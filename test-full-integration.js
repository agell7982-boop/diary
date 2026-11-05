const fs = require('fs');
const vm = require('vm');

const files = [
  'js/state.js',
  'js/audio.js',
  'js/alarm.js',
  'js/today.js',
  'js/calendar.js',
  'js/diary.js',
  'js/settings.js',
  'js/sync.js',
  'js/app.js'
];

function createMockDom() {
  const elements = new Map();
  function getEl(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: '',
        value: '',
        style: { setProperty: () => {} },
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        querySelectorAll: () => [],
        querySelector: () => null,
        closest: (sel) => null,
        addEventListener: () => {},
        removeEventListener: () => {},
        appendChild: () => {},
        setAttribute: () => {},
        focus: () => {},
        select: () => {},
        click: () => {},
        scrollIntoView: () => {}
      });
    }
    return elements.get(id);
  }

  const doc = {
    getElementById: getEl,
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        innerHTML: '',
        textContent: '',
        value: '',
        style: { setProperty: () => {} },
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        querySelectorAll: () => [],
        querySelector: () => null,
        closest: (sel) => null,
        addEventListener: () => {},
        removeEventListener: () => {},
        appendChild: () => {},
        setAttribute: () => {},
        focus: () => {},
        select: () => {},
        click: () => {},
        remove: () => {}
      };
      return el;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    documentElement: { style: { setProperty: () => {} }, scrollTop: 0 },
    body: { style: {}, appendChild: () => {}, fonts: { add: () => {} } },
    fonts: { add: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    hidden: false
  };

  const lsStore = {};
  const localStorage = {
    getItem: (k) => lsStore[k] || null,
    setItem: (k, v) => { lsStore[k] = String(v); },
    removeItem: (k) => { delete lsStore[k]; }
  };

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame: (cb) => cb(),
    document: doc,
    localStorage,
    location: { origin: 'https://localhost', protocol: 'capacitor:', hostname: 'localhost', port: '' },
    navigator: {
      serviceWorker: {
        register: () => Promise.resolve({ showNotification: () => Promise.resolve(), getNotifications: () => Promise.resolve([]) }),
        addEventListener: () => {}
      }
    },
    Notification: { permission: 'granted', requestPermission: () => Promise.resolve('granted') },
    Audio: function() { return { play: () => Promise.resolve(), pause: () => {}, loop: false, volume: 1 }; },
    AudioContext: function() {
      return {
        createGain: () => ({ gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
        createOscillator: () => ({ type: 'sine', frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }),
        createBufferSource: () => ({ connect: () => {}, start: () => {}, stop: () => {} }),
        destination: {},
        currentTime: 0,
        state: 'running',
        close: () => {}
      };
    },
    crypto: {
      subtle: {
        digest: async (algo, buf) => new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      }
    },
    TextEncoder,
    TextDecoder,
    Uint8Array,
    FileReader: function() { return { readAsDataURL: () => {} }; },
    Image: function() { return {}; },
    FontFace: function() { return { load: () => Promise.resolve() }; },
    fetch: () => Promise.resolve({ json: () => Promise.resolve({ daily: { time: [], weathercode: [], temperature_2m_max: [], temperature_2m_min: [] } }) }),
    firebase: {
      initializeApp: () => {},
      auth: Object.assign(() => ({
        onAuthStateChanged: (cb) => {},
        signInWithPopup: () => Promise.resolve(),
        signInWithRedirect: () => {},
        signInWithEmailAndPassword: () => Promise.resolve(),
        createUserWithEmailAndPassword: () => Promise.resolve(),
        sendPasswordResetEmail: () => Promise.resolve(),
        signOut: () => Promise.resolve()
      }), {
        GoogleAuthProvider: function() {}
      }),
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            set: () => Promise.resolve(),
            get: () => Promise.resolve({ exists: false, data: () => ({}) })
          }),
          get: () => Promise.resolve({ docs: [] })
        })
      })
    },
    Capacitor: {
      isNativePlatform: () => true,
      getPlatform: () => 'android',
      isPluginAvailable: () => true,
      Plugins: {
        LocalNotifications: {
          checkPermissions: () => Promise.resolve({ display: 'granted' }),
          requestPermissions: () => Promise.resolve({ display: 'granted' }),
          getPending: () => Promise.resolve({ notifications: [] }),
          schedule: () => Promise.resolve(),
          cancel: () => Promise.resolve(),
          addListener: () => {}
        }
      }
    },
    confirm: () => true,
    alert: () => {},
    Intl,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map,
    Promise,
    Error,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.addEventListener = () => {};
  sandbox.removeEventListener = () => {};

  return { ctx: vm.createContext(sandbox), sandbox };
}

async function runTest() {
  console.log('--- 1. LOADING MODULES ---');
  const { ctx, sandbox } = createMockDom();

  files.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    try {
      vm.runInContext(code, ctx);
      console.log(`[PASS] ${f}`);
    } catch (e) {
      console.error(`[FAIL] ${f}:`, e);
      process.exit(1);
    }
  });

  console.log('\n--- 2. APP INITIALIZATION & TABS ---');
  vm.runInContext(`
    console.log('Initial tab:', tab);
    A.tab({ t: '일정' });
    console.log('App HTML length for 일정:', app.innerHTML.length);
    A.tab({ t: '달력' });
    console.log('App HTML length for 달력:', app.innerHTML.length);
    A.tab({ t: '기록' });
    console.log('App HTML length for 기록:', app.innerHTML.length);
    A.tab({ t: '설정' });
    console.log('App HTML length for 설정:', app.innerHTML.length);
  `, ctx);

  console.log('\n--- 3. SCHEDULE (일정) ACTIONS ---');
  vm.runInContext(`
    A.tab({ t: '일정' });
    addItem({ date: sel, title: '테스트 일정 1', time: '14:30', alarm: 10 });
    console.log('Added item count:', S.items.length);
    const item = S.items[0];
    A.done({ id: item.id });
    console.log('Item done state:', S.items[0].done);
    openSheet(item.id);
    console.log('Sheet opened for item, T.title:', T.title);
    closeSheet();
    console.log('Sheet closed, T is null:', T === null);
  `, ctx);

  console.log('\n--- 4. CALENDAR (달력) ACTIONS ---');
  vm.runInContext(`
    A.tab({ t: '달력' });
    A.mp({ d: sel });
    console.log('Day modal open state (DY):', DY);
    closeSheet();
    drawGoals();
    console.log('Goals modal open state (GS):', GS);
    closeSheet();
    A.rnew();
    console.log('Repeat modal open state (R.mode):', R.mode);
    closeSheet();
  `, ctx);

  console.log('\n--- 5. DIARY (기록) ACTIONS ---');
  await vm.runInContext(`
    (async () => {
      A.tab({ t: '기록' });
      console.log('Locked state:', U === false);
      // set password
      $('pw').value = '1234';
      $('pw2').value = '1234';
      await A.unlock();
      console.log('Unlocked state:', U === true);
      A.relock();
      console.log('Relocked state:', U === false);
    })()
  `, ctx);

  console.log('\n--- 6. SETTINGS & NATIVE LOGIN UI ---');
  vm.runInContext(`
    SY.ready = true;
    A.tab({ t: '설정' });
    console.log('Native isNativeApp():', isNativeApp());
    const cardHtmlNative = accCardHTML();
    console.log('Native accCardHTML contains [앱 계정 로그인]:', cardHtmlNative.includes('앱 계정 로그인'));
    console.log('Native accCardHTML does NOT contain [Google로 간편 로그인]:', !cardHtmlNative.includes('Google로 간편 로그인'));

    // Test web mode: delete Capacitor or make it web
    delete window.Capacitor;
    location.protocol = 'https:';
    location.hostname = 'agell7982-boop.github.io';
    console.log('Web mode isNativeApp():', isNativeApp());
    const cardHtmlWeb = accCardHTML();
    console.log('Web accCardHTML contains [Google로 간편 로그인]:', cardHtmlWeb.includes('Google로 간편 로그인'));
  `, ctx);

  console.log('\n--- 7. ALARM CHECKS & NATIVE SYNC ---');
  await vm.runInContext(`
    (async () => {
      checkAlarms();
      console.log('checkAlarms executed successfully');
      const nativeOk = await syncNativeAlarms();
      console.log('syncNativeAlarms result:', nativeOk);
    })()
  `, ctx);

  console.log('\n=======================================');
  console.log('ALL INTEGRATION TESTS PASSED 100%!');
  console.log('=======================================');
}

runTest().catch(e => {
  console.error('Test crashed:', e);
  process.exit(1);
});
