import React, { useState, useEffect, useRef } from 'react'
import Peer from 'simple-peer'
import CallEndIcon from '@material-ui/icons/CallEnd';
import { Card, Button } from '@material-ui/core'
import './app.css'
import io from 'socket.io-client'


const App = () => {

    const [startCalling, setStartCalling] = useState(false)
    const [recevingCall, setRecevingCall] = useState(false)
    const [caller, setCaller] = useState()
    const [callerSignal, setCallerSignal] = useState()
    const [callAccepted, setCallAccepted] = useState(false)

    const [stream, setStream] = useState()
    const [yourID, setYourID] = useState("")
    const [allUser, setAllUser] = useState({})


    const myStream = useRef()
    const socket = useRef()
    const partnerVideo = useRef()
    useEffect(() => {
        socket.current = io.connect('http://localhost:5000')
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                setStream(stream)
                if (myStream.current) {
                    myStream.current.srcObject = stream
                }
            })


        //client accepts  the event   
        socket.current.on('yourID', data => {
            setYourID(data.id)
            console.log(data.id)
        })
        socket.current.on('allUsers', users => {
            setAllUser(users)
        })
        socket.current.on("hey", data => {
            setRecevingCall(true)
            setCaller(data.from)
            setCallerSignal(data.signal)
        })
    }, [])


    function callPerson(id) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream
        })
        peer.on("signal", data => {
            // this  function provide  the    current  client video as object through the socket io 
            socket.current.emit("callUser", { userToCall: id, signalData: data, from: yourID })
        })
        peer.on("stream", stream => {
            // this funciton accept the other partner video and set itn to current client window
            if (partnerVideo.current) {
                partnerVideo.current.srcObject = stream
            }
        })

        socket.current.on('callAccepted', data => {
            setCallAccepted(true)
            peer.signal(data)
        })
    }
    function callAccept() {
        setCallAccepted(true)
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        })
        peer.on("signal", data => {
            socket.current.emit("acceptCall", { signal: data, to: caller })
        })
        peer.on('stream', stream => {
            if (partnerVideo.current) {
                partnerVideo.current.srcObject = stream
            }
        })
        peer.signal(callerSignal)
    }



    return (
        <div>
            <h3 className="text-danger text-center">Video Call</h3>
            <p className="text-center">My ID : {yourID}</p>
            <h6>Partner :</h6>
            {
                recevingCall ?

                    <div className="d-flex">
                        <h3 className="text-success text-center"> {caller} <b> Called you !</b>  </h3>
                        <button className="btn btn-success" onClick={() => { callAccept() }}>Recive</button>
                    </div>
                    : ''
            }
            {
                Object.keys(allUser).map(single => {
                    return (
                        <div style={{ display: 'flex' }}>

                            {
                                single === yourID ? '' :
                                    <div className="d-flex">
                                        <p> ID : {single} </p>
                                        <button onClick={() => { callPerson(single) }} >call</button>
                                    </div>
                            }
                        </div>
                    )
                })
            }
            <div className="col-md-8 offset-md-2">
                <Card className="mt-5">
                    <div className="videoContainer">
                        <div className="partnerVideo"></div>
                        <div className="myVideo">
                            <video playsInline muted ref={myStream} autoPlay />
                        </div>
                        <div className="endCallBtn">
                            <div className="iconContainer">
                                <div className="_icon">
                                    <CallEndIcon />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
export default App