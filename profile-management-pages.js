/* Small bridge loaded by index.html. Keep management-page enhancements separate from app.js. */
(function(){
  'use strict';
  if(document.querySelector('script[data-dialog-theme]')) return;
  const script=document.createElement('script');
  script.src='dialog-theme.js?v=20260930-01';
  script.async=false;
  script.dataset.dialogTheme='1';
  document.body.appendChild(script);
})();
