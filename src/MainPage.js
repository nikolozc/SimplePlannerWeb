import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase'; 
import { collection, addDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import './styles/MainPage.css';

function MainPage() {
    const [boards, setBoards] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [showBoardInput, setShowBoardInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeBoard, setActiveBoard] = useState(null);

    useEffect(() => {
        if(auth.currentUser) {
            setUserInfo(auth.currentUser.displayName || auth.currentUser.email);
        }
    }, [auth.currentUser]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('Successfully signed out');
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
                members: [owner]  // Need to add other members in the future
            });
            console.log("Document written with ID: ", docRef.id);
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
            let data = doc.data();
            fetchedBoards.push({ id: doc.id, ...data });
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
                let data = doc.data();
                updatedBoards.push({ id: doc.id, ...data });
            });
            callback(updatedBoards);
        });
      
        return unsubscribe;
    };

    return (
        <div className="main-container">
            <div className="top-panel">
                <button className="logout-button" onClick={handleLogout}>Logout</button>
                <span className="user-info">{userInfo}</span>
            </div>
            <div className="side-main-content">
                <div className="side-panel">
                    <h2>Your Boards</h2>
                    <button className="add-board-button" onClick={() => setShowBoardInput(true)}>+</button>
                    {showBoardInput && (
                        <div className="board-input-popup">
                            <input 
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder="Board Name"
                            />
                            <button onClick={() => {
                                createBoard(inputValue);
                                setShowBoardInput(false);
                                setInputValue('');
                            }}>Add Board</button>
                            <button onClick={() => setShowBoardInput(false)}>Cancel</button>
                        </div>
                    )}
                    <div className="boards-list">
                        {boards.map(board => (
                            <div 
                                key={board.id} 
                                className={`board-item ${activeBoard === board.id ? 'active' : ''}`} 
                                onClick={() => setActiveBoard(board.id)}
                            >
                                {board.name}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="main-content">
                    {activeBoard && (
                        <div>
                            <h1>{boards.find(b => b.id === activeBoard)?.name}</h1>
                            {/* You can display other board details here */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MainPage;