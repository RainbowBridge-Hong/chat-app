// Rainbow Chat - Professional Chat App v2
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

  // Init demo data with more realistic scenarios
  function initData(){
    DB.contacts=[
      {id:1,name:'张伟',phone:'13800138001',avatar:'👨‍💼',status:'在线',lastSeen:'现在'},
      {id:2,name:'刘芳',phone:'13800138002',avatar:'👩‍💼',status:'在线',lastSeen:'现在'},
      {id:3,name:'王姐',phone:'13800138003',avatar:'👩',status:'离线',lastSeen:'5分钟前'},
      {id:4,name:'陈雪',phone:'13800138004',avatar:'👩‍🦰',status:'在线',lastSeen:'现在'},
      {id:5,name:'小李',phone:'13800138005',avatar:'👨',status:'在线',lastSeen:'现在'},
      {id:6,name:'赵姐',phone:'13800138006',avatar:'👩‍🦱',status:'离线',lastSeen:'1小时前'},
      {id:7,name:'林总',phone:'13800138007',avatar:'👨‍💼',status:'在线',lastSeen:'现在'},
      {id:8,name:'陈默',phone:'13800138008',avatar:'👨',status:'在线',lastSeen:'现在'},
    ];
    DB.chats=[
      {id:1,name:'张伟',type:'person',avatar:'👨‍💼',msgs:[
        {from:'张伟',text:'你好！',time:'09:20',mine:false},
        {from:'我',text:'你好，有什么事吗？',time:'09:22',mine:true},
        {from:'张伟',text:'项目进度怎么样了',time:'09:25',mine:false},
        {from:'我',text:'已经完成80%了，预计明天上午完成',time:'09:26',mine:true}
      ],lastMsg:'已经完成80%了，预计明天上午完成',time:'09:26',unread:0},
      {id:2,name:'产品一部群',type:'group',avatar:'👥',members:['张伟','刘芳','王姐'],msgs:[
        {from:'刘芳',text:'大家好',time:'10:00',mine:false},
        {from:'王姐',text:'早上好~',time:'10:02',mine:false},
        {from:'我',text:'各位早上好！',time:'10:05',mine:true},
        {from:'刘芳',text:'今天有会议吗',time:'10:08',mine:false}
      ],lastMsg:'今天有会议吗',time:'10:08',unread:0},
      {id:3,name:'技术部群',type:'group',avatar:'👥',members:['张伟','陈雪'],msgs:[
        {from:'陈雪',text:'代码已提交',time:'昨天',mine:false},
        {from:'我',text:'好的，我来审核',time:'昨天',mine:true}
      ],lastMsg:'好的，我来审核',time:'昨天',unread:0},
    ];
    DB.notifications=[
      {id:1,type:'msg',title:'新消息',desc:'张伟发来了一条消息',time:'09:22',read:false},
      {id:2,type:'group',title:'群组邀请',desc:'被邀请加入"产品一部群"',time:'10:00',read:false},
      {id:3,type:'msg',title:'新消息',desc:'刘芳: 今天有会议吗',time:'10:08',read:false},
    ];
    DB.settings={
      notifications:true,
      sound:true,
      vibration:true,
      cloudSync:false
    };
    ['contacts','chats','notifications','collectedEmojis','settings'].forEach(save);
    localStorage.setItem('chat_inited','1');
  }

  // Auth
  function login(){
    var name=el('loginUser').value.trim();
    var pwd=el('loginPwd').value;
    if(!name||!pwd){alert('请输入用户名和密码');return;}
    DB.user={name:name,phone:'13800138000',avatar:'👤',status:'在线',joinTime:new Date().toLocaleString()};
    localStorage.setItem('chat_user',JSON.stringify(DB.user));
    showApp();
  }

  function register(){
    var name=el('regUser').value.trim();
    var phone=el('regPhone').value.trim();
    var pwd=el('regPwd').value;
    if(!name||!phone||!pwd){alert('请填写完整信息');return;}
    if(!/^1[3-9]\d{9}$/.test(phone)){alert('请输入有效的手机号');return;}
    DB.user={name:name,phone:phone,avatar:'👤',status:'在线',joinTime:new Date().toLocaleString()};
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
    renderChatList();
    updateNotificationBadge();
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
    el('chatList').innerHTML=h||'<div style="text-align:center;color:#999;padding:32px">暂无聊天</div>';
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
    el('headerTitle').textContent=currentChat.name+(currentChat.type==='group'?' ('+currentChat.members.length+'人)':'');
    el('msgInput').focus();
  }

  function renderMessages(){
    if(!currentChat)return;
    var h='';
    (currentChat.msgs||[]).forEach(function(m){
      h+='<div class="msg '+(m.mine?'mine':'')+'">'
        +'<div class="msg-avatar" title="'+m.from+'" onclick="app.showMemberInfo(\''+m.from+'\')">'+getAvatar(m.from)+'</div>'
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
    currentChat.msgs.push({from:'我',text:text,time:getTime(),mine:true});
    currentChat.lastMsg=text;
    currentChat.time=getTime();
    save('chats');
    input.value='';
    renderMessages();
    renderChatList();
    // Auto reply
    setTimeout(function(){
      var replies=['好的','收到','👍','明白了','稍等','好的呢','同意','可以的','没问题','我知道了'];
      var reply=replies[Math.floor(Math.random()*replies.length)];
      var sender=currentChat.type==='group'?currentChat.members[Math.floor(Math.random()*currentChat.members.length)]:currentChat.name;
      currentChat.msgs.push({from:sender,text:reply,time:getTime(),mine:false});
      currentChat.lastMsg=reply;
      save('chats');
      renderMessages();
      // Add notification
      addNotification('msg','新消息',sender+': '+reply);
    },500+Math.random()*1500);
  }

  function sendImage(){
    var url=prompt('输入图片URL：');
    if(!url)return;
    if(!currentChat.msgs)currentChat.msgs=[];
    currentChat.msgs.push({from:'我',img:url,time:getTime(),mine:true});
    currentChat.lastMsg='[图片]';
    save('chats');
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
    currentChat.msgs.push({from:'我',text:emoji,time:getTime(),mine:true});
    currentChat.lastMsg=emoji;
    save('chats');
    renderMessages();
    renderChatList();
    el('emojiPicker').classList.remove('show');
    // Collect emoji
    if(!DB.collectedEmojis.includes(emoji)){
      DB.collectedEmojis.push(emoji);
      if(DB.collectedEmojis.length>20)DB.collectedEmojis.shift();
      save('collectedEmojis');
    }
  }

  // New Chat
  function showNewChat(){
    var h='';
    DB.contacts.forEach(function(c){
      h+='<div class="member-item" onclick="app.createChat(\''+c.name+'\')">'
        +'<div class="member-avatar">'+c.avatar+'</div>'
        +'<div class="member-info">'
        +'<div class="member-name">'+c.name+'</div>'
        +'<div class="member-status">'+c.phone+' · '+(c.status==='在线'?'🟢 '+c.status:'🔴 '+c.lastSeen)+'</div>'
        +'</div></div>';
    });
    el('contactsList').innerHTML=h;
    el('newChatModal').classList.add('show');
  }

  function createChat(name){
    var contact=DB.contacts.find(function(c){return c.name===name;});
    var existing=DB.chats.find(function(c){return c.name===name;});
    if(existing){
      closeModal('newChatModal');
      openChat(existing.id);
      return;
    }
    var c={id:Date.now(),name:name,type:'person',avatar:contact?contact.avatar:'👤',msgs:[{from:name,text:'你好！',time:getTime(),mine:false}],lastMsg:'你好！',time:getTime(),unread:1};
    DB.chats.unshift(c);
    save('chats');
    closeModal('newChatModal');
    renderChatList();
    openChat(c.id);
    addNotification('msg','新消息',name+': 你好！');
  }

  // New Group
  function showNewGroup(){
    selectedGroupMembers=[];
    var h='';
    DB.contacts.forEach(function(c){
      h+='<div class="member-item" onclick="app.toggleGroupMember(\''+c.name+'\')">'
        +'<div class="member-avatar">'+c.avatar+'</div>'
        +'<div class="member-info">'
        +'<div class="member-name">'+c.name+'</div>'
        +'<div class="member-status">'+c.phone+'</div>'
        +'</div>'
        +'<div style="width:20px;height:20px;border:2px solid #ddd;border-radius:50%;margin-left:auto" id="check-'+c.name+'"></div>'
        +'</div>';
    });
    el('groupMembersList').innerHTML=h;
    el('newGroupModal').classList.add('show');
  }

  function toggleGroupMember(name){
    var idx=selectedGroupMembers.indexOf(name);
    if(idx>=0){
      selectedGroupMembers.splice(idx,1);
      el('check-'+name).style.background='transparent';
    }else{
      selectedGroupMembers.push(name);
      el('check-'+name).style.background='var(--primary)';
    }
  }

  function createGroup(){
    var name=el('newGroupName').value.trim();
    if(!name){alert('请输入群组名称');return;}
    if(selectedGroupMembers.length===0){alert('请选择至少一个成员');return;}
    var c={id:Date.now(),name:name,type:'group',avatar:'👥',members:selectedGroupMembers,msgs:[{from:'系统',text:'群组已创建',time:getTime(),mine:false}],lastMsg:'群组已创建',time:getTime(),unread:0};
    DB.chats.unshift(c);
    save('chats');
    closeModal('newGroupModal');
    el('newGroupName').value='';
    selectedGroupMembers=[];
    renderChatList();
    openChat(c.id);
    addNotification('group','群组创建',name+'已创建');
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

  function showMemberInfo(name){
    var c=DB.contacts.find(function(x){return x.name===name;});
    if(!c)return;
    alert(c.name+'\n'+c.phone+'\n状态: '+c.status+'\n最后活动: '+c.lastSeen);
  }

  function addNotification(type,title,desc){
    DB.notifications.unshift({id:Date.now(),type:type,title:title,desc:desc,time:getTime(),read:false});
    if(DB.notifications.length>50)DB.notifications.pop();
    save('notifications');
    updateNotificationBadge();
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
    if(name==='我')return DB.user?DB.user.avatar:'👤';
    if(name==='系统')return '⚙️';
    var c=DB.contacts.find(function(x){return x.name===name;});
    return c?c.avatar:'👤';
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
    // Close modal on outside click
    document.addEventListener('click',function(e){
      if(e.target.classList.contains('modal')){
        e.target.classList.remove('show');
      }
    });
  }

  window.app={
    login:login,register:register,logout:logout,switchTab:switchTab,
    openChat:openChat,sendMsg:sendMsg,sendImage:sendImage,sendEmoji:sendEmoji,toggleEmojiPicker:toggleEmojiPicker,
    showNewChat:showNewChat,createChat:createChat,
    showNewGroup:showNewGroup,toggleGroupMember:toggleGroupMember,createGroup:createGroup,
    showProfile:showProfile,showMemberInfo:showMemberInfo,closeModal:closeModal,searchChats:searchChats,
    showNotifications:showNotifications,markNotificationRead:markNotificationRead
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{init();}
})();
