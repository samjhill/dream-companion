export const generateRandomNumber = (length: number) => {
    const randomNumber = Math.floor(Math.random() * length);
    return randomNumber;
}