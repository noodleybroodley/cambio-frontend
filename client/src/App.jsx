import './App.css';
import { useState, useEffect } from 'react';
import { getMusicKitInstance,getApplePlaylist } from './Apple/Apple-Helpers';
import { ClientEvent } from "clientevent";
import SuccessDialog from './components/SuccessDialog/SuccessDialog';
import ErrorDialog from './components/ErrorDialog';
import { CircularProgress } from '@mui/material';
import Title from './components/Title';
import PlaylistSearchBar from './components/CustomizedForm/PlaylistSearchBar';
import PlaylistInfo from './components/PlaylistInfo/PlaylistInfo';

export function App() {
  const [playlistIDObj, setPlaylistIDObj] = useState({isSpotify: false,id: ""});
  const [playlistName, setPlaylistName] = useState("");
  const [playlist, setPlaylist] = useState(undefined);
  const [playlistTracks, setPlaylistTracks] = useState(undefined);
  const [musicKit, setMusicKit] = useState(undefined);
  const [isLoading, setLoading] = useState(false);
  const [invalidSongs, setInvalidSongs] = useState([]);
  const [hasAuth, setHasAuth] = useState(false);

  async function login() {
    /*** Reaches out to the backend, authenticates with Spotify using developer token
     * and creates an Apple MusicKit instance.
     */
    fetch(`${process.env.REACT_APP_BACKEND_ROUTE}/api/login`).then(response => response.json())
      .then(res => {
        setHasAuth(true);
        console.log("Spotify Auth Successful!")
      }).catch(error => {
        console.log(error)
      })
    let kit = await getMusicKitInstance();
    setMusicKit(kit);
  };

  function getSpotifyPlaylist() {
    /*** Reaches out to the backend and uses the given playlist ID to retrieve all playlist tracks.*/
    let route = `${process.env.REACT_APP_BACKEND_ROUTE}/api/getPlaylist/` + playlistIDObj['id'];
    fetch(route).then((res) => {
      res.json().then((data) => {
        if (data[0].body?.error) {
          ClientEvent.emit('error', { type: "Playlist Error", message: "Enter valid playlist URL!" });
        } else {
          setPlaylistTracks(data[0]);
          setPlaylist(data[1].body);
          console.log(data[1].body);
        }
      })
    }
    )
  }

  useEffect(() => {
    login();
    const loadingSub = ClientEvent.subscribe('loading', () => {
      setLoading(true);
    })
    const stopLoadSub = ClientEvent.subscribe('stopped_loading', (songs) => {
      setInvalidSongs(songs);
      setLoading(false);
    })
    return () => {
      loadingSub.unsubscribe();
      stopLoadSub.unsubscribe();

    }
  }, []);

  return (
    <div className="App">
      {hasAuth ?
        <>
          <Title hasPlaylist={!!playlist} />
          <PlaylistSearchBar
            hasPlaylist={!!playlist}
            onSubmit={async ()=>{
              playlistIDObj["isSpotify"] === true ? getSpotifyPlaylist() : await getApplePlaylist(playlistIDObj["id"],musicKit,setPlaylistTracks,setPlaylist);
            }}
            onChange={e => {
              e.preventDefault();
              let id = e.target.value;
              let isSpotify = false;
              if(id.includes("spotify")){
                isSpotify = true;
                id = id.replace("https://open.spotify.com/playlist/", "");
              } else {
                let idArray = id.split("/");
                id = idArray[idArray.length - 1];
              }
              setPlaylistIDObj({id: id,isSpotify: isSpotify})
            }}
          />
          {playlist ?
            <PlaylistInfo
              playlist={playlist}
              playlistTracks={playlistTracks}
              isLoading={isLoading}
              setPlaylist={setPlaylist}
              setPlaylistTracks={setPlaylistTracks}
              musicKit={musicKit}
              playlistName={playlistName}
              setPlaylistName={setPlaylistName}
              isSpotify={playlistIDObj.isSpotify}
            />
            :
            null
          }
          <SuccessDialog invalidSongs={invalidSongs} />
          <ErrorDialog />
        </>
        :
        <div style={{ position: "relative", top: "40vh" }}>
          <div>Loading...</div>
          <CircularProgress style={{ height: 300, width: 300, color: "white" }} />
        </div>
      }
    </div>
  );
}

export default App;
