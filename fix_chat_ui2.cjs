const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');
let fixes = 0;

// ============================================================
// FIX 2: Chat header - make it position fixed
// ============================================================
// Find the exact string using a partial match approach
const headerDivOld = `display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px 6px 4px', background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>`;
const headerDivNew = `position: 'fixed', top: 'calc(56px + env(safe-area-inset-top, 0px))', left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px 6px 4px', background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>`;
if (c.includes(headerDivOld)) { c = c.replace(headerDivOld, headerDivNew); fixes++; console.log('Fix2: chat header fixed position'); }
else console.log('WARN Fix2: chat header div not found');

// ============================================================
// FIX 3: Send button - remove colored background
// ============================================================
const sendBtnOld = `style={{ background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#fff', flexShrink: 0 }}>`;
const sendBtnNew = `style={{ background: 'none', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#00c8a0', flexShrink: 0 }}>`;
if (c.includes(sendBtnOld)) { c = c.replace(sendBtnOld, sendBtnNew); fixes++; console.log('Fix3: send button redesign'); }
else {
  // Try to find it differently
  const idx = c.indexOf('linear-gradient(135deg,#00c8a0,#00b4e6)');
  if (idx > -1) {
    console.log('Found gradient at index', idx, '- context:', c.substring(idx-50, idx+100));
  } else {
    console.log('WARN Fix3: send button gradient not found at all');
  }
}

// Also update the send icon size
const sendIconOld = `<svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
const sendIconNew = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
if (c.includes(sendIconOld)) { c = c.replace(sendIconOld, sendIconNew); fixes++; console.log('Fix3b: send icon size'); }
else console.log('WARN Fix3b: send icon not found');

// ============================================================
// FIX 5: Input bar outer wrapper - cleaner background
// ============================================================
const inputWrapperOld = `background: '#FFFFFF',
                borderTop: '1px solid rgba(0,0,0,0.07)',
                padding: '10px 10px',
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'`;
const inputWrapperNew = `background: '#f0f2f5',
                borderTop: 'none',
                padding: '8px 8px',
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'`;
if (c.includes(inputWrapperOld)) { c = c.replace(inputWrapperOld, inputWrapperNew); fixes++; console.log('Fix5: input bar wrapper redesign'); }
else {
  // Try partial
  const idx = c.indexOf("background: '#FFFFFF'");
  if (idx > -1) console.log('Found #FFFFFF at', idx, '- context:', c.substring(idx-20, idx+150));
  else console.log('WARN Fix5: input bar wrapper not found');
}

// ============================================================
// FIX 6: Attach (+) button - cleaner style
// ============================================================
const attachOld = `background: showChatAttach ? 'rgba(0,180,230,0.15)' : '#f5f6f7', border: \`1px solid \${showChatAttach ? 'rgba(0,180,230,0.3)' : '#f3f4f6'}\`, borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: showChatAttach ? '#00b4e6' : '#9ca3af', flexShrink: 0, transition: 'all 0.15s' }}`;
const attachNew = `background: 'none', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: showChatAttach ? '#00b4e6' : '#9ca3af', flexShrink: 0 }}`;
if (c.includes(attachOld)) { c = c.replace(attachOld, attachNew); fixes++; console.log('Fix6: attach button redesign'); }
else {
  const idx = c.indexOf("'rgba(0,180,230,0.15)'");
  if (idx > -1) console.log('Found attach bg at', idx, '- context:', c.substring(idx-20, idx+200));
  else console.log('WARN Fix6: attach button not found');
}

// ============================================================
// FIX 7: Emoji button - cleaner style
// ============================================================
const emojiOld = `background: showChatEmojis ? '#FEF3C7' : 'transparent', border: 'none', borderRadius: '50%', color: showChatEmojis ? '#f59e0b' : '#6b7280', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0, transition: 'all 0.15s' }}`;
const emojiNew = `background: 'none', border: 'none', borderRadius: '50%', color: showChatEmojis ? '#f59e0b' : '#9ca3af', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0 }}`;
if (c.includes(emojiOld)) { c = c.replace(emojiOld, emojiNew); fixes++; console.log('Fix7: emoji button redesign'); }
else {
  const idx = c.indexOf("'#FEF3C7'");
  if (idx > -1) console.log('Found emoji bg at', idx, '- context:', c.substring(idx-20, idx+200));
  else console.log('WARN Fix7: emoji button not found');
}

fs.writeFileSync('App.tsx', c, 'utf8');
console.log('\n=== Total fixes applied:', fixes, '===');
