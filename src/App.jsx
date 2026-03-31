import { useState , useEffect  } from 'react'
// import {io} from 'socket.io-client'
import { io } from "socket.io-client";
import './App.css'

const socket = io(import.meta.env.VITE_BACKEND_URL)

function App() {

  const [board , setBoard]= useState(Array(9).fill(''));
  const [turn , setTurn] = useState('X');
  const [roomId , setRoomId] = useState(null);
  const [mySymbol, setMySymbol] = useState(null);
  const [isSearching , setIsSearching] = useState(false);
  const [lobby , setLobby] = useState(true);
  const [winner , setWinner] = useState(null);
  const[rematchStatus , setRematchStatus] = useState(null);
  
  useEffect(() => {

    socket.on("game:start" , (data) => {
      setIsSearching(false);
      setRoomId(data.roomId);
      setBoard(data.board);
      setWinner(null);
      setRematchStatus("none");
      setTurn('X');
      if(socket.id  == data.players.X){
        setMySymbol('X');
      }
      else{
        setMySymbol('O');
      }
    });
    
    socket.on("game:update" , (data) => {
      setBoard(data.board);
      setTurn(data.turn);
    });

    socket.on("game:over" , (data) => {
      setWinner(data.winner);
      setBoard(data.board);
      // setIsSearching(false);
    });

    socket.on("game:rematchInvited" ,() => {
      setRematchStatus("received");
    });

    socket.on("game:opponentLeft", () => {
      setRematchStatus("opponentLeft");
    });

    return () => {
      socket.off("game:start");
      socket.off("game:update");
      socket.off("game:over");
      socket.off("game:rematchInvited");
      socket.off("game:opponentLeft");
    }

  },[])
  
  const handleCLick = (i) => {
    if(!roomId) return;
    if(board[i] != '') return;
    if(turn !== mySymbol) return;
    
    socket.emit("game:move",{
      roomId,
      cell:i
    });
  };

  const requestRematch = () => {
    setRematchStatus("sent");
    socket.emit("game:rematchRequest" , {roomId});
  }

  const joinGame = () => {
    setIsSearching(true);
    setLobby(false);
    socket.emit("game:join");
  };

  const goToLobby = () => {
    socket.emit("game:leave", { roomId });
    setRoomId(null);
    setBoard(Array(9).fill(''));
    setWinner(null);
    setRematchStatus(null);
    setLobby(true);
  };

  const chance=turn === mySymbol ? "Your Turn" : "Opponent's Turn"
  
  return (
    <div className='container'>
      <h1> Tic Tac Toe </h1>

      {!roomId ? (
          !isSearching ? (
            <button className = "join-Button" onClick={() => {
              joinGame();
            }}>JOIN GAME</button>
           ) : (<p className = "join-Button">Searching for the game</p>)
        ) : (
          winner ? (
            <p className = "join-Button" >{winner === mySymbol ? "You have " : winner === "draw" ? "It's a Draw , no one " : "Opponnent has"} won the game</p>
          ) : (
            <p className = "join-Button">Playing as : <strong>{mySymbol}</strong></p>
          )
        )
      }

      {!isSearching && !lobby &&  <h3 className='status'> Turn : {chance} </h3>}
      <div className='board'>
        {
          board.map((cell,i) => (
            <button key={i} className='cell' onClick={() => {
              handleCLick(i);
            }}>{cell}</button>
          ))
        }

      </div>

      {winner &&
          <div className='end-screen'>
            {rematchStatus === "none" && <button className='end-screen' onClick={requestRematch}>Request Rematch</button>}
            {rematchStatus === "sent" && <p>Waiting for opponent...</p>}
            {rematchStatus === "received" && <button className='end-screen' onClick={requestRematch}>Accept Rematch</button>}
            {rematchStatus === "opponentLeft" && <p>Opponent has left the game.</p>}
            <button className='end-screen' onClick={goToLobby}>Go to Lobby</button>
          </div>
        }

    </div>
  )
}

export default App
