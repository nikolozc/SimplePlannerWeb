import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase'; 
import { collection, addDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import './styles/MainPage.css';

function MainPage() {
    const [boards, setBoards] = useState([]); // all boards tied to the user
    const [lists, setLists] = useState([]); // all lists
    const [cards, setCards] = useState([]); // all cards

    const [showBoardInput, setShowBoardInput] = useState(false); // state to track if input fields for adding new boards is visible
    const [showListInput, setShowListInput] = useState(false); // state to track if input fields for adding new lists is visible
    const [showCardInput, setShowCardInput] = useState(false); // state to track if input fields for adding new cards is visible
    const [activeList, setActiveList] = useState(null); // state to track which list's "Add New Card" was clicked.

    const [inputValue, setInputValue] = useState(''); // input for new board name
    const [activeBoard, setActiveBoard] = useState(null); // state to track which board is being viewed in the main container
    const [newListName, setNewListName] = useState(''); // input for new list name
    const [newCardName, setNewCardName] = useState(''); // input for new card name
    const [newCardDescription, setNewCardDescription] = useState(''); // input for new card description


    // logout from account using firebase authentication
    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('Successfully signed out');
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    // creates new board and adds it in db under current user
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

    // creates new list and adds it in db under current active board
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

    // creates new card and adds it in db under current active list
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

    // gets all the boards from db under current user and adds it to boards
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

    // gets all the lists from db under current active board
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

    // gets all the cards from db under current active list
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

    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    // Need to set this up for lists and cards as well for realtime changes when the ability to add more users to the same board is added
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

    // This useEffect is responsible for fetching the lists associated with the currently active board (defined by activeBoard).
    // Once the lists are fetched, it further fetches the cards for each of those lists.
    // The fetched lists and cards are then set to the component's local state.
    // The function is triggered every time the activeBoard changes.
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
                <span className="user-info">{auth.currentUser?.displayName || auth.currentUser?.email}</span>
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
                                                    </div>
                                                ))}
                                                {showCardInput && activeList === list.id ? (
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
                                                            setNewCardName('');  
                                                            setNewCardDescription('');
                                                            setShowCardInput(false);
                                                            setActiveList(null);
                                                        }}>
                                                            Add Card
                                                        </button>
                                                        <button onClick={() => {
                                                            setShowCardInput(false);
                                                            setNewCardName('');
                                                            setNewCardDescription('');
                                                        }}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button className='add-new-card-button' onClick={() => {
                                                        setActiveList(list.id);
                                                        setShowCardInput(true);
                                                    }}>
                                                        Add New Card
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                {showListInput ? (
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

                                            setShowListInput(false); // Hide the input form
                                        }}>
                                            Add List
                                        </button>
                                        <button onClick={() => {
                                            setShowListInput(false); // Hide the input form
                                            setNewListName(''); // Clear the input value
                                        }}>
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button className='add-new-list-button' onClick={() => setShowListInput(true)}>
                                        Add New List
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MainPage;