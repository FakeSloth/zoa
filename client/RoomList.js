// @flow

const RoomList = {
  props: ['allRooms'],
  template: `
  <div class="container">
    <br>
    <div class="list-group">
      <div v-for="room in allRooms">
        <router-link class="list-group-item list-group-item-action" v-bind:to="'/room/' + room.id">
          <h5 class="list-group-item-heading">{{room.name}}</h5>
          <p>{{room.userCount}} users</p>
        </router-link>
      </div>
    </div>
  </div>
  `
};

module.exports = RoomList;
