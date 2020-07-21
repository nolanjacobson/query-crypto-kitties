import React, { Component, useEffect, useState } from 'react'
import axios from 'axios'
import Web3 from 'web3'
import * as _ from 'underscore'
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(
    'wss://mainnet.infura.io/ws/v3/afc37c6df5ef4ebc8a06c4bf7ba1b229'
  )
)
let abi =
  '[{"anonymous":false,"inputs":[{"indexed":false,"name":"owner","type":"address"},{"indexed":false,"name":"kittyId","type":"uint256"},{"indexed":false,"name":"matronId","type":"uint256"},{"indexed":false,"name":"sireId","type":"uint256"},{"indexed":false,"name":"genes","type":"uint256"}],"name":"Birth","type":"event"}]'
let address = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d'
var aContract = new web3.eth.Contract(JSON.parse(abi), address)
const QueryCryptoKitties = () => {
  // store each pastEvents response array in an array to be reduced
  let eventsPaginated = []
  let eventsLength = []

  // hook to display the numberOfBirths on page
  const [numberOfBirths, setNumberOfBirths] = useState(null)
  // hook to display the mostRepeatedKitty on page
  const [mostRepeatedKittyId, setMostRepeatedKittyId] = useState(null)
  //
  // hook to display the mostRepeatedKittyOwner on page
  const [mostRepeatedKittyOwner, setMostRepeatedKittyOwner] = useState(null)
  // hook to display the mostRepeatedKittyOwner on page
  const [kittyDetails, setKittyDetails] = useState(null)
  // block indexes
  const startingFromBlock = 6607985
  const endingToBlock = 7028323
  // activeBlocks initialization for loop
  let activeFromBlock = startingFromBlock
  let activeToBlock = startingFromBlock + 4999
  // Using 84 as a length because 7028323 - 6607985 is 42,0338 / 5,000 (maximum query size) - tried using /10,000 for 9999 but Infura returned query limit errors
  const getBirths = async () => {
    for (let i = 0; i < 84; i++) {
      console.log(activeFromBlock, activeToBlock)
      let birth = await aContract.getPastEvents('Birth', {
        filter: {},
        fromBlock: activeFromBlock,
        toBlock: activeToBlock,
      })
      // wait for the promise to resolve then push the array of birth events into the array
      if (birth) {
        eventsPaginated.push(birth)
        eventsLength.push(birth.length)
      }
      console.log(eventsPaginated[i])
      activeFromBlock = activeFromBlock += 5000
      activeToBlock =
        activeFromBlock !== 7022985 ? (activeToBlock += 5000) : 7028323
    }
    setNumberOfBirths(
      eventsLength.reduce((accumulator, currentValue) => {
        return accumulator + currentValue
      })
    )

    // leveraged StackOverflow to find the most commonly repeating object in an object array using underscore https://stackoverflow.com/questions/18878571/underscore-js-find-the-most-frequently-occurring-value-in-an-array
    let birthsArrayFilteredKittyId = _.pluck(
      [].concat.apply([], eventsPaginated).map((event) => {
        return event.returnValues
      }),
      'kittyId'
    )
    // create an array of kittyId values from the object array

    var findMostRepeatedKittyId = _.chain(birthsArrayFilteredKittyId)
      .countBy()
      .pairs()
      .max(_.last)
      .head()
      .value() //find the most commonly occurring kittyId value
    setMostRepeatedKittyId(findMostRepeatedKittyId)

    let birthsArrayFilteredOwner = _.pluck(
      [].concat.apply([], eventsPaginated).map((event) => {
        return event.returnValues
      }),
      'owner'
    )
    // create an array of kittyId values from the object array

    const findMostRepeatedKittyOwner = _.chain(birthsArrayFilteredOwner)
      .countBy()
      .pairs()
      .max(_.last)
      .head()
      .value() //find the most commonly occurring kittyId value
    setMostRepeatedKittyOwner(findMostRepeatedKittyOwner)
  }

  const getKittyDetails = async () => {
    const resp = await axios.get(
      `https://public.api.cryptokitties.co/v1/kitties/${mostRepeatedKittyId}`,
      {
        headers: {
          'x-api-token': 'ZG0Aj9y88MNovZotgZJOd3Ftt26UiBMj8EJefyU49us',
        },
      }
    )
    if (resp) {
      console.log(resp)
      setKittyDetails(resp.data)
    }
  }
  // effect that listens for mostRepeatedKittyId to update
  useEffect(() => {
    if (mostRepeatedKittyId) {
      getKittyDetails()
    }
  }, [mostRepeatedKittyId])
  useEffect(() => {
    // on page load, load the number of births
    getBirths()
  }, [])

  // waiting to receive an API key from CryptoKitties to provide more specific details such as timestamp, generation, and genese of the kitty that give birth the most kitties! UPDATE: API Key granted
  return (
    <>
      <p>
        Check the console to see the API call's being made, as this process
        takes some time!
      </p>
      <br></br>
      {numberOfBirths
        ? `Number of Births: ${numberOfBirths}`
        : 'Loading number of births...'}
      <br></br>
      {mostRepeatedKittyId
        ? `Most Repeated Kitty Id: ${mostRepeatedKittyId}`
        : 'Loading most repeated kitty...'}
      <br></br>
      {kittyDetails
        ? `Most Repeated Kitty Birthdate: ${kittyDetails.created_at}, Generation: ${kittyDetails.generation}, Name: ${kittyDetails.name} `
        : 'Loading most repeated kitty details...'}
      <br></br>
      {mostRepeatedKittyOwner
        ? `Most Repeated Kitty Owner: ${mostRepeatedKittyOwner}`
        : 'Loading most repeated kitty owner...'}
    </>
  )
}

export default QueryCryptoKitties
