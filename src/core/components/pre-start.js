'use strict'

const peerId = require('peer-id')
const PeerInfo = require('peer-info')
const multiaddr = require('multiaddr')
const waterfall = require('async/waterfall')
const mafmt = require('mafmt')

const utils = require('../utils')

/*
 * Load stuff from Repo into memory
 */
module.exports = function preStart (self) {
  return (callback) => {
    waterfall([
      (cb) => utils.ifRepoExists(self._repo, cb),
      (cb) => self._repo.config.get(cb),
      (config, cb) => {
        const privKey = config.Identity.PrivKey

        peerId.createFromPrivKey(privKey, (err, id) => {
          cb(err, config, id)
        })
      },
      (config, id, cb) => {
        self._peerInfo = new PeerInfo(id)

        config.Addresses.Swarm.forEach((addr) => {
          let ma = multiaddr(addr)

          if (!mafmt.IPFS.matches(ma)) {
            ma = ma.encapsulate('/ipfs/' +
              self._peerInfo.id.toB58String())
          }

          self._peerInfo.multiaddr.add(ma)
        })

        cb()
      }
    ], callback)
  }
}
