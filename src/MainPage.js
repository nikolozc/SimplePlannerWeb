import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase'; 
import { collection, addDoc, query, where, getDocs, getDoc, onSnapshot } from "firebase/firestore";
import './styles/MainPage.css';

function MainPage() {
    const [boards, setBoards] = useState([]);
    const [lists, setLists] = useState([]);
    const [cards, setCards] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [showBoardInput, setShowBoardInput] = useState(false);
    const [inputValue, setInputValue] = useState(''); //rename this to something better. Input for new boards
    const [activeBoard, setActiveBoard] = useState(null);
    const [newListName, setNewListName] = useState('');
    const [newCardName, setNewCardName] = useState('');
    const [newCardDescription, setNewCardDescription] = useState('');

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

    const createList = async (boardId, listName, order) => {
        try {
            await addDoc(collection(db, 'boards', boardId, 'lists'), {
                name: listName,
                order: order
            });
            console.log("List added successfully.");
        } catch (error) {
            console.error("Error adding list: ", error);
        }
    };

    const createCard = async (boardId, listId, cardName, cardDescription = "", order) => {
        try {
            const newCardRef = await addDoc(collection(db, 'boards', boardId, 'lists', listId, 'cards'), {
                name: cardName,
                description: cardDescription,
                order: order,
                listId: listId
            });
            console.log("Card added successfully.");
    
            // add new card to the list of cards
            setCards(prevCards => [...prevCards, { id: newCardRef.id, name: cardName, description: cardDescription, order: order, listId: listId }]);
        } catch (error) {
            console.error("Error adding card: ", error);
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

    const fetchListsForBoard = async (boardId) => {
        const lists = [];
        const listsSnapshot = await getDocs(collection(db, 'boards', boardId, 'lists'));
        listsSnapshot.forEach(doc => {
            const listData = doc.data();
            lists.push({
                id: doc.id,
                ...listData
            });
        });
        return lists.sort((a, b) => a.order - b.order);  // sorting by order
    };

    const fetchCardsForList = async (boardId, listId) => {
        const cards = [];
        const cardsSnapshot = await getDocs(collection(db, 'boards', boardId, 'lists', listId, 'cards'));
        cardsSnapshot.forEach(doc => {
            const cardData = doc.data();
            cards.push({
                id: doc.id,
                ...cardData
            });
        });
        return cards.sort((a, b) => a.order - b.order);  // sorting by order
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

    useEffect(() => {
        if (activeBoard) {
            const getLists = async () => {
                const fetchedLists = await fetchListsForBoard(activeBoard);
                setLists(fetchedLists);
                
                // Then, for each list, fetch its cards and update the cards state
                const allCards = [];
                for (let list of fetchedLists) {
                    const fetchedCards = await fetchCardsForList(activeBoard, list.id);
                    allCards.push(...fetchedCards);
                }
                setCards(allCards);
            };
            getLists();
        }
    }, [activeBoard]);

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
                            <button onClick={() => {
                                setShowBoardInput(false);
                                setInputValue('');}}>Cancel</button>
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
                        <>
                            <h1>{boards.find(b => b.id === activeBoard)?.name}</h1>
                            <div className="list-container">
                                {lists.map(list => (
                                    <div key={list.id} className="list">
                                        <h2>{list.name}</h2>
                                        <div className="cards">
                                            {cards.filter(card => card.listId === list.id).map(card => (
                                                <div key={card.id} className="card">
                                                    <h3>{card.name}</h3>
                                                    <p>{card.description}</p>
                                                    {/* Render other card details here */}
                                                </div>
                                            ))}

                                            <div className="new-card">
                                                <input 
                                                    value={newCardName} 
                                                    onChange={e => setNewCardName(e.target.value)} 
                                                    placeholder="Card Name" 
                                                />
                                                <input 
                                                    value={newCardDescription} 
                                                    onChange={e => setNewCardDescription(e.target.value)} 
                                                    placeholder="Card Description" 
                                                />
                                                <button onClick={async () => {
                                                    await createCard(activeBoard, list.id, newCardName, newCardDescription, cards.filter(card => card.listId === list.id).length);
                                                    setNewCardName('');  // Clear the input
                                                    setNewCardDescription('');  // Clear the input
                                                }}>
                                                    Add Card
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="new-list">
                                <input 
                                    value={newListName} 
                                    onChange={e => setNewListName(e.target.value)} 
                                    placeholder="New List Name" 
                                />
                                <button onClick={async () => {
                                    await createList(activeBoard, newListName, lists.length);
                                    setNewListName('');  // Clear the input once the list is added

                                    // Refetch the lists for the board after adding a new list
                                    const updatedLists = await fetchListsForBoard(activeBoard);
                                    setLists(updatedLists);
                                }}>
                                    Add List
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MainPage;