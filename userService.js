import { usersCollection } from "./firebase.js";

import {
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/**
 * Realtime Subscribe
 */

export function subscribeUsers(callback){

    return onSnapshot(usersCollection, (snapshot)=>{

        const users = snapshot.docs.map(docItem => ({

    ...docItem.data(),

    id: docItem.id

}));

        callback(users);

    });

}

/**
 * Create User
 */

export async function createUser(user){

    return await addDoc(usersCollection,user);

}

/**
 * Update User
 */

export async function updateUser(userId, data){

    const ref = doc(usersCollection, userId);

    return await updateDoc(ref, data);

}

/**
 * Delete User
 */

export async function deleteUser(userId){

    const ref = doc(usersCollection, userId);

    return await deleteDoc(ref);

}