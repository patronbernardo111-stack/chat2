const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');
let fixes = 0;

// FIX 1: Polling más rápido — de 3000ms a 1500ms
const old1 = '    }, 3000);';
const new1 = '    }, 1500);';
if (c.includes(old1)) { c = c.replace(old1, new1); fixes++; console.log('Fix1: polling 1500ms'); }

// FIX 2: Audio duplicado — añadir guard para evitar múltiples envíos
// El problema es que recorder.onstop puede llamarse múltiples veces
// Añadimos un flag para evitarlo
const old2 = "                      recorder.onstop = async () => {\r\n                        stream.getTracks().forEach(t => t.stop());\r\n                        if (chatRecordTimerRef.current) { clearInterval(chatRecordTimerRef.current); chatRecordTimerRef.current = null; }\r\n                        setChatRecordingTime(0);\r\n                        if (chatAudioChunksRef.current.length === 0) return;";
const new2 = "                      let audioSent = false;\r\n                      recorder.onstop = async () => {\r\n                        if (audioSent) return; audioSent = true;\r\n                        stream.getTracks().forEach(t => t.stop());\r\n                        if (chatRecordTimerRef.current) { clearInterval(chatRecordTimerRef.current); chatRecordTimerRef.current = null; }\r\n                        setChatRecordingTime(0);\r\n                        if (chatAudioChunksRef.current.length === 0) return;";
if (c.includes(old2)) { c = c.replace(old2, new2); fixes++; console.log('Fix2: audio guard'); }
else {
  // Try with \n
  const old2b = "                      recorder.onstop = async () => {\n                        stream.getTracks().forEach(t => t.stop());\n                        if (chatRecordTimerRef.current) { clearInterval(chatRecordTimerRef.current); chatRecordTimerRef.current = null; }\n                        setChatRecordingTime(0);\n                        if (chatAudioChunksRef.current.length === 0) return;";
  const new2b = "                      let audioSent = false;\n                      recorder.onstop = async () => {\n                        if (audioSent) return; audioSent = true;\n                        stream.getTracks().forEach(t => t.stop());\n                        if (chatRecordTimerRef.current) { clearInterval(chatRecordTimerRef.current); chatRecordTimerRef.current = null; }\n                        setChatRecordingTime(0);\n                        if (chatAudioChunksRef.current.length === 0) return;";
  if (c.includes(old2b)) { c = c.replace(old2b, new2b); fixes++; console.log('Fix2b: audio guard'); }
  else console.log('Fix2: audio guard not found - checking...');
}

// FIX 3: endCall — limpiar todo el estado de llamada correctamente
const old3 = "  const endCall = () => {\n    stopRingtone(); stopDialingTone(); playCallEnded(); vibrate([100, 50, 100]);\n    // Registrar llamada en el chat\n    if (activeCall) {\n      const status = activeCall.status === 'connected' ? 'completed' : 'outgoing';\n      addCallRecord(activeCall.type, status, callDuration, activeCall.contact);\n    }\n    webrtc.endCall();\n    if (localStream) { localStream.getTracks().forEach(t => t.stop()); setLocalStream(null); }\n    setActiveCall(null); setCallDuration(0);\n  };";
const new3 = "  const endCall = () => {\n    stopRingtone(); stopDialingTone(); playCallEnded(); vibrate([100, 50, 100]);\n    // Registrar llamada en el chat\n    if (activeCall) {\n      const status = activeCall.status === 'connected' ? 'completed' : 'outgoing';\n      addCallRecord(activeCall.type, status, callDuration, activeCall.contact);\n    }\n    try { webrtc.endCall(); } catch {}\n    // Limpiar todos los streams y estado\n    if (localStream) { localStream.getTracks().forEach(t => { try { t.stop(); } catch {} }); setLocalStream(null); }\n    // Limpiar video elements\n    if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = null; }\n    if (localVideoRef.current) { localVideoRef.current.srcObject = null; }\n    setActiveCall(null); setCallDuration(0); setIsMuted(false); setIsCameraOff(false);\n  };";
if (c.includes(old3)) { c = c.replace(old3, new3); fixes++; console.log('Fix3: endCall cleanup'); }
else {
  // Try CRLF
  const old3b = "  const endCall = () => {\r\n    stopRingtone(); stopDialingTone(); playCallEnded(); vibrate([100, 50, 100]);\r\n    // Registrar llamada en el chat\r\n    if (activeCall) {\r\n      const status = activeCall.status === 'connected' ? 'completed' : 'outgoing';\r\n      addCallRecord(activeCall.type, status, callDuration, activeCall.contact);\r\n    }\r\n    webrtc.endCall();\r\n    if (localStream) { localStream.getTracks().forEach(t => t.stop()); setLocalStream(null); }\r\n    setActiveCall(null); setCallDuration(0);\r\n  };";
  const new3b = "  const endCall = () => {\r\n    stopRingtone(); stopDialingTone(); playCallEnded(); vibrate([100, 50, 100]);\r\n    if (activeCall) {\r\n      const status = activeCall.status === 'connected' ? 'completed' : 'outgoing';\r\n      addCallRecord(activeCall.type, status, callDuration, activeCall.contact);\r\n    }\r\n    try { webrtc.endCall(); } catch {}\r\n    if (localStream) { localStream.getTracks().forEach(t => { try { t.stop(); } catch {} }); setLocalStream(null); }\r\n    if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = null; }\r\n    if (localVideoRef.current) { localVideoRef.current.srcObject = null; }\r\n    setActiveCall(null); setCallDuration(0); setIsMuted(false); setIsCameraOff(false);\r\n  };";
  if (c.includes(old3b)) { c = c.replace(old3b, new3b); fixes++; console.log('Fix3b: endCall cleanup'); }
  else console.log('Fix3: endCall not found');
}

fs.writeFileSync('App.tsx', c, 'utf8');
console.log('\nTotal fixes:', fixes);
console.log('polling 1500:', c.includes('}, 1500);'));
console.log('audioSent guard:', c.includes('audioSent'));
