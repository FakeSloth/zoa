// @flow

const Settings = {
  data() {
    return {
      notifications: '',
      emotes: '',
      dark: ''
    };
  },
  template: `
    <div class="container settings">
     <h2>Settings</h2>
     <div id="options">
     <h6>Chat Notifications</h6>
     <div>
       <input type="radio" name="notifs" v-model="notifications" value="on"> Enabled<br>
       <input type="radio" name="notifs" v-model="notifications" value="username"> Username Only<br>
       <input type="radio" name="notifs" v-model="notifications" value="off"> Disabled
     </div>
     <h6>Chat Style</h6>
     <div>
       <label>
      <input
        type="checkbox"
		v-model="emotes"
      />
       See emotes in the chat
       </label>
     </div>
     <div>
       <label>
      <input
        type="checkbox"
		v-model="dark"
      />
       Dark chat theme
       </label>
     </div>
    </div>
    </div>
  `
};

module.exports = Settings;
