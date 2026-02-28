import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type TopicStatus = 'pending' | 'in-progress' | 'completed';

export interface ResearchTopic {
  id?: string;
  title: string;
  status: TopicStatus;
  linkedInvestigationId?: string;
  linkedInvestigationTitle?: string;
  notes?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface ResearchCollection {
  id?: string;
  title: string;
  description: string;
  notes?: string;
  topics: ResearchTopic[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// Create a new research collection
export async function createResearchCollection(
  data: Omit<ResearchCollection, 'id' | 'createdAt' | 'updatedAt' | 'topics'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'researchCollections'), {
      ...data,
      topics: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating research collection:', error);
    throw error;
  }
}

// Update a research collection
export async function updateResearchCollection(
  id: string,
  data: Partial<Omit<ResearchCollection, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'researchCollections', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating research collection:', error);
    throw error;
  }
}

// Delete a research collection
export async function deleteResearchCollection(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'researchCollections', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting research collection:', error);
    throw error;
  }
}

// Get all research collections
export async function getAllResearchCollections(): Promise<ResearchCollection[]> {
  try {
    const q = query(collection(db, 'researchCollections'), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ResearchCollection[];
  } catch (error) {
    console.error('Error getting research collections:', error);
    throw error;
  }
}

// Get a single research collection by ID
export async function getResearchCollectionById(id: string): Promise<ResearchCollection | null> {
  try {
    const docRef = doc(db, 'researchCollections', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ResearchCollection;
    }
    return null;
  } catch (error) {
    console.error('Error getting research collection by ID:', error);
    throw error;
  }
}

// Add a topic to a collection
export async function addTopicToCollection(
  collectionId: string,
  topic: Omit<ResearchTopic, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const collectionRef = doc(db, 'researchCollections', collectionId);
    const collectionSnap = await getDoc(collectionRef);

    if (!collectionSnap.exists()) {
      throw new Error('Collection not found');
    }

    const currentTopics = collectionSnap.data().topics || [];
    const newTopic: ResearchTopic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...topic,
      createdAt: Timestamp.now(),
    };

    await updateDoc(collectionRef, {
      topics: [...currentTopics, newTopic],
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding topic to collection:', error);
    throw error;
  }
}

// Update a topic in a collection
export async function updateTopicInCollection(
  collectionId: string,
  topicId: string,
  updates: Partial<ResearchTopic>
): Promise<void> {
  try {
    const collectionRef = doc(db, 'researchCollections', collectionId);
    const collectionSnap = await getDoc(collectionRef);

    if (!collectionSnap.exists()) {
      throw new Error('Collection not found');
    }

    const currentTopics = collectionSnap.data().topics || [];
    const updatedTopics = currentTopics.map((topic: ResearchTopic) =>
      topic.id === topicId ? { ...topic, ...updates } : topic
    );

    await updateDoc(collectionRef, {
      topics: updatedTopics,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating topic in collection:', error);
    throw error;
  }
}

// Delete a topic from a collection
export async function deleteTopicFromCollection(
  collectionId: string,
  topicId: string
): Promise<void> {
  try {
    const collectionRef = doc(db, 'researchCollections', collectionId);
    const collectionSnap = await getDoc(collectionRef);

    if (!collectionSnap.exists()) {
      throw new Error('Collection not found');
    }

    const currentTopics = collectionSnap.data().topics || [];
    const filteredTopics = currentTopics.filter((topic: ResearchTopic) => topic.id !== topicId);

    await updateDoc(collectionRef, {
      topics: filteredTopics,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error deleting topic from collection:', error);
    throw error;
  }
}
