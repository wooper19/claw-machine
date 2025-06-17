"use client"
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push } from "firebase/database";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { useEffect } from "react";

export default function FB0529() {
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCic-lIUrLujxBzoDq6N6HeH0snPet6lx0",
    authDomain: "nccu-113-2-whitee.firebaseapp.com",
    projectId: "nccu-113-2-whitee",
    storageBucket: "nccu-113-2-whitee.firebasestorage.app",
    messagingSenderId: "1044617659475",
    appId: "1:1044617659475:web:78fb267d12e9982b8772a6",
    databaseURL: "https://nccu-113-2-whitee-default-rtdb.firebaseio.com/"
  };

 // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  const dbRef = ref(database, "/");

  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  


  useEffect(()=>{
    

    onValue(dbRef, (snapshot)=>{
      console.log( snapshot.val() );
    });

    const userRef = ref(database, "/accounts/0000001/");
    set(userRef,{
      name:"white",
      points:200
    });

  }, []);

  const addNewAccount = () =>{
    console.log("clicked");
    const accountRef = ref(database, "/accounts");

    push(accountRef,{
      name:"Pai",
      type:"User",
      points:10
    });
    
  }

  const login = ()=> {
    signInWithPopup(auth, provider).then((result)=>{
      console. Log (result);
      console. log (result.user.uid);
      console.log(result.user.displayName);

      const uid = result.user.uid;
      const name = result.user.displayName;

      const accountRef = ref (database, "/accounts/" + uid);
      
      if(!accountRef){
       //有此帳號
      
      }else{
        push(accountRef,{
          name:"Pai",
          type:"User",
          points:10
        });
      }

    });

  }

  return (
    <>
      fb0529
      <div onClick={addNewAccount} className =" text-black border-black border-2 px-4 py-1 inline-block">Add new Acoount</div>
      <div onClick={login} className =" text-black border-black border-2 px-4 py-1 inline-block">Login with GOOGLE</div>

    </>
    
  );
}