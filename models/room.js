const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const Schema = mongoose.Schema
const roomSchema = new Schema({
  roomName: {
    type: String,
    required: true,
    default: '[room_name]'
  },
  id: {
    type: ObjectId,
    required: true,
    default: '[room_id]'
  },
  description: {
    type: String,
    required: false,
    default: '-'
  }

})

module.exports = Item = mongoose.model('user', userSchema)