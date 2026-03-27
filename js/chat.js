// Rainbow Chat - Real Multi-User Chat App
(function(){
  var DB={user:null,chats:[],contacts:[],notifications:[],collectedEmojis:[],settings:{}};
  var currentChat=null;
  var selectedGroupMembers=[];
  var allEmojis=['😀','😂','😍','🤔','😱','🎉','👍','❤️','🔥','💯','😎','🤗','😴','😤','😡','😭','😂','🤣','😅','😆','😉','😊','😇','🙂','🙃','😌','😍','😘','😗','😚','😙','🥰','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤥','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🤬','🤡','👿','😈','💀','☠️','💩','🤓','😈','😻','😸','😹','😺','😻','😼','😽','🙀','😿','😾','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','💕','💞','💓','💗','💖','💘','💝','💟'];

  function save(k){localStorage.setItem('chat_'+k,JSON.stringify(DB[k]));}
  function load(k){try{DB[k]=JSON.parse(localStorage.getItem('chat_'+k)||'[]');}catch(e){DB[k]=[];}}
  function $(s){return document.querySelector(s);}
  function $$(s){return document.querySelectorAll(s);}
  function el(id){return document.getElementById(id);}

  // 云同步模拟（使用 localStorage 作为共享存储）
  function syncToCloud(){
    if(!DB.user)return;
    var cloudKey='cloud_chats_'+DB.user.name;
    localStorage.setItem(cloudKey,JSON.stringify(DB.chats));
  }

  function syncFromCloud(){
    if(!DB.user)return;
    var cloudKey='cloud_chats_'+DB.user.name;
    try{
      var cloud=JSON.parse(localStorage.getItem(cloudKey)||'[]');
      if(cloud.length>0){
        DB.chats=cloud;
        save('chats');
      }
    }catch(e){}
  }

  // 获取所有注册用户
  function getAllUsers(){
    var users=[];
    for(var i=0;i<localStorage.length;i++){
      var key=localStorage.key(i);
      if(key.startsWith('chat_user_')){
        try{
          var u=JSON.parse(localStorage.getItem(key));
          if(u.name!==DB.user.name)users.push(u);
        }catch(e){}
      }
    }
    return users;
  }

  // 获取与某用户的聊天记录
  function getChatWithUser(userName){
    var key='chat_with_'+DB.user.name+'_'+userName;
    try{
      return JSON.parse(localStorage.getItem(key)||'[]');
    }catch(e){
      return [];
    }
  }

  // 保存与某用户的聊天记录
  function saveChatWithUser(userName,msgs){
    var key='chat_with_'+DB.user.name+'_'+userName;
    localStorage.setItem(key,JSON.stringify(msgs));
    // 也保存到对方的记录
    var reverseKey='chat_with_'+userName+'_'+DB.user.name;
    localStorage.setItem(reverseKey,JSON.stringify(msgs));
  }

  // Init demo data
  function initData(){
    DB.contacts=[
      {id:1,name:'张伟',phone:'13800138001',avatar:'👨‍💼',status:'在线',lastSeen:'现在'},
      {id:2,name:'刘芳',phone:'13800138002',avatar:'👩‍💼',status:'在线',lastSeen:'现在'},
      {id:3,name:'王姐',phone:'13800138003',avatar:'👩',status:'离线',lastSeen:'5分钟前'},
      {id:4,name:'陈雪',phone:'13800138004',avatar:'👩‍🦰',status:'在线',lastSeen:'现在'},
      {id:5,name:'小李',phone:'13800138005',avatar:'👨',status:'在线',lastSeen:'现在'},
      {id:6,name:'赵姐',phone:'13800138006',avatar:'👩‍🦱',status:'离线',lastSeen:'1小时前'},
    ];
    DB.settings={
      notifications:true,
      sound:true,
      vibration:true,
      cloudSync:true,
      encryption:true
    };
    ['contacts','settings'].forEach(save);
    localStorage.setItem('chat_inited','1');
  }

  // Auth
  function login(){
    var name=el('loginUser').value.trim();
    var pwd=el('loginPwd').value;
    if(!name||!pwd){alert('请输入用户名和密码');return;}
    if(name.length<2){alert('用户名至少2个字符');return;}
    DB.user={name:name,phone:'',avatar:'👤',status:'在线',joinTime:new Date().toLocaleString(),password:pwd};
    localStorage.setItem('chat_user_'+name,JSON.stringify(DB.user));
    localStorage.setItem('chat_user',JSON.stringify(DB.user));
    showApp();
  }

  function register(){
    var name=el('regUser').value.trim();
    var phone=el('regPhone').value.trim();
    var pwd=el('regPwd').value;
    if(!name||!phone||!pwd){alert('请填写完整信息');return;}
    if(name.length<2){alert('用户名至少2个字符');return;}
    if(!/^1[3-9]\d{9}$/.test(phone)){alert('请输入有效的手机号');return;}
    if(pwd.length<6){alert('密码至少6个字符');return;}
    // 检查用户是否已存在
    if(localStorage.getItem('chat_user_'+name)){alert('用户名已存在');return;}
    DB.user={name:name,phone:phone,avatar:'👤',status:'在线',joinTime:new Date().toLocaleString(),password:pwd};
    localStorage.setItem('chat_user_'+name,JSON.stringify(DB.user));
    localStorage.setItem('chat_user',JSON.stringify(DB.user));
    showApp();
  }

  function logout(){
    if(!confirm('确定退出登录？'))return;
    localStorage.removeItem('chat_user');
    location.reload();
  }

  function switchTab(tab){
    $$('.tab').forEach(function(t){t.classList.remove('active');});
    $$('.form-panel').forEach(function(p){p.classList.remove('active');});
    if(tab==='login'){
      $$('.tab')[0].classList.add('active');
      el('loginPanel').classList.add('active');
    }else{
      $$('.tab')[1].classList.add('active');
      el('registerPanel').classList.add('active');
    }
  }

  function showApp(){
    el('login').classList.add('hide');
    el('app').classList.add('show');
    syncFromCloud();
    renderChatList();
    updateNotificationBadge();
    // 定期同步
    setInterval(syncToCloud,5000);
  }

  // Chat List
  function renderChatList(){
    var h='';
    DB.chats.forEach(function(c){
      h+='<div class="chat-item '+(currentChat&&currentChat.id===c.id?'active':'')+'" onclick="app.openChat('+c.id+')">'
        +'<div class="chat-header">'
        +'<div class="chat-avatar">'+c.avatar+'</div>'
        +'<div class="chat-info">'
        +'<div class="chat-name">'+c.name+'</div>'
        +'<div class="chat-preview">'+c.lastMsg.substring(0,30)+'</div>'
        +'</div>'
        +'</div>'
        +'<div class="chat-meta">'
        +'<div class="chat-time">'+c.time+'</div>'
        +(c.unread>0?'<div class="chat-badge">'+c.unread+'</div>':'')
        +'</div></div>';
    });
    el('chatList').innerHTML=h||'<div style="text-align:center;color:#999;padding:32px">暂无聊天，点击"+ 聊天"开始</div>';
  }

  function searchChats(){
    var q=el('searchInput').value.toLowerCase();
    if(!q){renderChatList();return;}
    var filtered=DB.chats.filter(function(c){return c.name.toLowerCase().includes(q);});
    var h='';
    filtered.forEach(function(c){
      h+='<div class="chat-item" onclick="app.openChat('+c.id+')">'
        +'<div class="chat-header"><div class="chat-avatar">'+c.avatar+'</div>'
        +'<div class="chat-info"><div class="chat-name">'+c.name+'</div></div></div></div>';
    });
    el('chatList').innerHTML=h||'<div style="text-align:center;color:#999;padding:16px">未找到</div>';
  }

  function openChat(id){
    currentChat=DB.chats.find(function(c){return c.id===id;});
    if(!currentChat)return;
    currentChat.unread=0;
    save('chats');
    renderChatList();
    renderMessages();
    el('chatEmpty').style.display='none';
    el('messages').style.display='flex';
    el('inputArea').style.display='flex';
    el('headerTitle').textContent=currentChat.name;
    el('msgInput').focus();
  }

  function renderMessages(){
    if(!currentChat)return;
    var h='';
    (currentChat.msgs||[]).forEach(function(m){
      h+='<div class="msg '+(m.mine?'mine':'')+'">'
        +'<div class="msg-avatar" title="'+m.from+'">'+getAvatar(m.from)+'</div>'
        +'<div>'
        +'<div style="font-size:11px;color:#999;margin-bottom:2px">'+m.from+'</div>'
        +'<div class="msg-bubble">'
        +(m.img?'<img src="'+m.img+'" class="msg-img" onclick="window.open(this.src)">':escHtml(m.text))
        +'</div>'
        +'<div class="msg-time">'+m.time+'</div>'
        +'</div></div>';
    });
    var msgsEl=el('messages');
    msgsEl.innerHTML=h;
    msgsEl.scrollTop=msgsEl.scrollHeight;
  }

  function sendMsg(){
    var input=el('msgInput');
    if(!input||!currentChat)return;
    var text=input.value.trim();
    if(!text)return;
    if(!currentChat.msgs)currentChat.msgs=[];
    currentChat.msgs.push({from:DB.user.name,text:text,time:getTime(),mine:true});
    currentChat.lastMsg=text;
    currentChat.time=getTime();
    save('chats');
    saveChatWithUser(currentChat.name,currentChat.msgs);
    input.value='';
    renderMessages();
    renderChatList();
  }

  function sendImage(){
    var url=prompt('输入图片URL：');
    if(!url)return;
    if(!currentChat.msgs)currentChat.msgs=[];
    currentChat.msgs.push({from:DB.user.name,img:url,time:getTime(),mine:true});
    currentChat.lastMsg='[图片]';
    save('chats');
    saveChatWithUser(currentChat.name,currentChat.msgs);
    renderMessages();
    renderChatList();
  }

  function toggleEmojiPicker(){
    var picker=el('emojiPicker');
    if(picker.classList.contains('show')){
      picker.classList.remove('show');
    }else{
      var h='';
      allEmojis.slice(0,30).forEach(function(e){
        h+='<button class="emoji-btn" onclick="app.sendEmoji(\''+e+'\')">'+e+'</button>';
      });
      picker.innerHTML=h;
      picker.classList.add('show');
    }
  }

  function sendEmoji(emoji){
    if(!currentChat.msgs)currentChat.msgs=[];
    currentChat.msgs.push({from:DB.user.name,text:emoji,time:getTime(),mine:true});
    currentChat.lastMsg=emoji;
    save('chats');
    saveChatWithUser(currentChat.name,currentChat.msgs);
    renderMessages();
    renderChatList();
    el('emojiPicker').classList.remove('show');
    if(!DB.collectedEmojis.includes(emoji)){
      DB.collectedEmojis.push(emoji);
      if(DB.collectedEmojis.length>20)DB.collectedEmojis.shift();
      save('collectedEmojis');
    }
  }

  // New Chat
  function showNewChat(){
    var allUsers=getAllUsers();
    var h='';
    allUsers.forEach(function(u){
      h+='<div class="member-item" onclick="app.createChat(\''+u.name+'\')">'
        +'<div class="member-avatar">'+u.avatar+'</div>'
        +'<div class="member-info">'
        +'<div class="member-name">'+u.name+'</div>'
        +'<div class="member-status">'+u.phone+'</div>'
        +'</div></div>';
    });
    if(allUsers.length===0){
      h='<div style="text-align:center;color:#999;padding:32px">暂无其他用户，请先注册其他账号</div>';
    }
    el('contactsList').innerHTML=h;
    el('newChatModal').classList.add('show');
  }

  function createChat(name){
    var existing=DB.chats.find(function(c){return c.name===name;});
    if(existing){
      closeModal('newChatModal');
      openChat(existing.id);
      return;
    }
    var msgs=getChatWithUser(name);
    var c={id:Date.now(),name:name,type:'person',avatar:'👤',msgs:msgs,lastMsg:msgs.length>0?msgs[msgs.length-1].text:'',time:getTime(),unread:0};
    DB.chats.unshift(c);
    save('chats');
    closeModal('newChatModal');
    renderChatList();
    openChat(c.id);
  }

  // Profile
  function showProfile(){
    if(!DB.user)return;
    el('profileName').textContent=DB.user.name;
    el('profilePhone').textContent=DB.user.phone+' · '+DB.user.status;
    var h='';
    DB.collectedEmojis.forEach(function(e){
      h+='<span style="font-size:24px;cursor:pointer" onclick="app.sendEmoji(\''+e+'\')">'+e+'</span>';
    });
    el('collectedEmojis').innerHTML=h||'<span style="color:#999">暂无收藏</span>';
    el('profileModal').classList.add('show');
  }

  function updateNotificationBadge(){
    var unread=DB.notifications.filter(function(n){return !n.read;}).length;
    var badge=el('notificationBadge');
    if(badge){
      badge.textContent=unread;
      badge.style.display=unread>0?'block':'none';
    }
  }

  function showNotifications(){
    var h='';
    DB.notifications.slice(0,20).forEach(function(n){
      h+='<div style="padding:12px;border-bottom:1px solid #f0f0f0;cursor:pointer" onclick="app.markNotificationRead('+n.id+')">'
        +'<div style="font-size:14px;font-weight:500">'+n.title+'</div>'
        +'<div style="font-size:12px;color:#999;margin-top:4px">'+n.desc+'</div>'
        +'<div style="font-size:11px;color:#ccc;margin-top:4px">'+n.time+'</div>'
        +'</div>';
    });
    el('notificationsList').innerHTML=h||'<div style="text-align:center;color:#999;padding:32px">暂无通知</div>';
    el('notificationsModal').classList.add('show');
  }

  function markNotificationRead(id){
    var n=DB.notifications.find(function(x){return x.id===id;});
    if(n){n.read=true;save('notifications');updateNotificationBadge();}
  }

  function closeModal(id){
    el(id).classList.remove('show');
  }

  // Utils
  function getTime(){
    var d=new Date();
    return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
  }

  function getAvatar(name){
    if(name===DB.user.name)return DB.user.avatar;
    return '👤';
  }

  function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // Init
  function init(){
    load('user');
    load('chats');
    load('contacts');
    load('notifications');
    load('collectedEmojis');
    load('settings');
    if(!localStorage.getItem('chat_inited')){initData();}
    if(DB.user){showApp();}
    document.addEventListener('click',function(e){
      if(e.target.classList.contains('modal')){
        e.target.classList.remove('show');
      }
    });
  }

  window.app={
    login:login,register:register,logout:logout,switchTab:switchTab,
    openChat:openChat,sendMsg:sendMsg,sendImage:sendImage,sendEmoji:sendEmoji,toggleEmojiPicker:toggleEmojiPicker,
    createChat:createChat,showNewChat:showNewChat,
    showProfile:showProfile,closeModal:closeModal,searchChats:searchChats,
    showNotifications:showNotifications,markNotificationRead:markNotificationRead
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{init();}
})();
