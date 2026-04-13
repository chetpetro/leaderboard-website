export const msToTime = (duration) => {
    const milliseconds = duration.toString().slice(-3);
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor(duration / (1000 * 60 * 60));

    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    hours = (hours < 10) ? "0" + hours : hours;
    hours = hours === "00" ? "" : hours + ":";
    minutes = hours === "" && minutes === "00" ? "" : minutes + ":";

    return hours + minutes + seconds + "." + milliseconds;
};

