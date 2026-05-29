import WebSocket from './node_modules/ws/index.js';
const ws = new WebSocket('ws://localhost:9222/devtools/page/FE4F6D4515014958EDF12B19B489B665');
let id = 1;

function send(method, params = {}) {
  ws.send(JSON.stringify({ id: id++, method, params }));
}

ws.on('open', () => {
  const js = `(function() {
    const inputs = document.querySelectorAll('input');
    const emailInput = inputs[0];
    const passInput = inputs[1];
    const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeSet.call(emailInput, 'cliente@prueba.com');
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    nativeSet.call(passInput, 'Prueba1234');
    passInput.dispatchEvent(new Event('input', { bubbles: true }));
    return emailInput.value + ' | ' + passInput.value.length + ' chars';
  })()`;
  send('Runtime.evaluate', { expression: js, returnByValue: true });
  setTimeout(() => { ws.close(); process.exit(0); }, 2000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.result) console.log('CDP Result:', JSON.stringify(msg.result));
});
ws.on('error', (e) => { console.error('Error:', e.message); process.exit(1); });
