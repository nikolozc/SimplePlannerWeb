import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase'; 
import { collection, addDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import './styles/MainPage.css';

function MainPage() {
    const [boards, setBoards] = useState([]);
    const [boardName, setBoardName] = useState('');

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('Successfully signed out');
            // Redirect or do something after logging out if needed
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    const createBoard = async (boardName) => {
        const owner = auth.currentUser.uid;  // Fetching user ID from the auth instance
        try {
            const docRef = await addDoc(collection(db, "boards"), {
                name: boardName,
                owner: owner,
                members: [owner]  // Start with just the owner in members
            });
            console.log("Document written with ID: ", docRef.id);
            setBoardName('');  // Clearing the input field
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    };

    const fetchUserBoards = async () => {
        const userId = auth.currentUser.uid; // Fetching user ID from the auth instance
        const boardQuery = query(collection(db, "boards"), where("members", "array-contains", userId));
        const querySnapshot = await getDocs(boardQuery);
        const fetchedBoards = [];
        querySnapshot.forEach((doc) => {
            fetchedBoards.push(doc.data());
        });
        setBoards(fetchedBoards);
    };

    useEffect(() => {
        // Fetching user boards on component mount
        fetchUserBoards();

        // Setting up real-time listener
        const unsubscribe = listenToUserBoards(auth.currentUser.uid, (updatedBoards) => {
            setBoards(updatedBoards);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, []);

    const listenToUserBoards = (userId, callback) => {
        const boardQuery = query(collection(db, "boards"), where("members", "array-contains", userId));
        const unsubscribe = onSnapshot(boardQuery, (snapshot) => {
            const updatedBoards = [];
            snapshot.forEach((doc) => {
                updatedBoards.push(doc.data());
            });
            callback(updatedBoards);
        });
      
        return unsubscribe;
    };

    return (
        <div className="main-container">
            <h1 className="main-header">Welcome to MainPage</h1>
            <div>
                {boards.map((board, index) => (
                    <div key={index}>
                        <h2>{board.name}</h2>
                        {/* You can display other board details here */}
                    </div>
                ))}
            </div>
            <input 
                value={boardName}
                onChange={e => setBoardName(e.target.value)}
                placeholder="Enter board name"
            />
            <button onClick={() => createBoard(boardName)}>Create Board</button>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default MainPage;