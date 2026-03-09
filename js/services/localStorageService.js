//set item
function setItem(key, value) {
    try {
        const str = JSON.stringify(value);
        localStorage.setItem(key, str);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

//get item
function getItem(key) {
    try {
        const str = localStorage.getItem(key);
        return str ? JSON.parse(str) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

//remove item
function removeItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

//clear all
function clearAll() {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

//export as singleton service
export const LocalStorageService = {
    setItem,
    getItem,
    removeItem,
    clearAll,
};