import React, { useState, useEffect } from 'react';
import { formatDate } from '../helpers/date';
import { getUserPhoneNumber } from '../helpers/user';

import 'ldrs/ring';

const DreamContent = ({ dream }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (<div style={{ backgroundColor: "rgb(0 0 0 / 50%)", padding: ".25rem", marginBottom: "1rem", borderRadius: "5px" }} key={dream["id"]} onClick={() => !isOpen && setIsOpen(true)}>
    <div style={{ display: "flex" }}>
      <div style={{ marginLeft: "1rem", marginTop: ".5rem" }}>{formatDate(dream["createdAt"])}</div>
      <div style={{ marginLeft: "auto" }}>
        <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? "hide" : "show"}</button>
      </div>
    </div>
    {isOpen ? (
      <>
        <div style={{ backgroundColor: "rgb(0 0 0 / 50%)", padding: ".25rem", marginBottom: ".25rem", padding: ".5rem" }}>
          <h3>Your dream</h3>
          <p>{dream["dream_content"]}</p>
        </div>


        <div style={{ backgroundColor: "rgb(47 47 47 / 50%)", padding: ".25rem", marginBottom: ".25rem", padding: ".5rem" }}>
          <h3>Response</h3>
          <p>{dream["response"]}</p>
        </div>
      </>
    ) : null}
  </div>)
};

const DreamList = () => {
  const [dreams, setDreams] = useState([]);

  useEffect(() => {
    const fetchDreams = async () => {
      const phoneNumber = await getUserPhoneNumber();

      try {
        const response = await fetch(`http://localhost:8888/api/dreams/${phoneNumber.replace("+", "")}`);
        const data = await response.json();

        let dreamFiles = [];
        for (let i = 0; i < data.length; i++) {
          const key = data[i]["key"];
          if (key.includes("metadata")) {
            continue;
          }
          const response = await fetch(`http://localhost:8888/api/dreams/${key}`);
          const dreamData = await response.json();

          dreamFiles = [...dreamFiles, dreamData];
        }

        setDreams(dreamFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (error) {
        console.error("Error fetching dreams:", error);
      }
    };

    fetchDreams();
  }, []);

  return (
    <div style={{ "padding": ".5rem" }}>
      <h2>Your Dreams</h2>
      {dreams.length === 0 && <l-ring size="60" color="coral"></l-ring>}
      {dreams?.map(dream => (
        <DreamContent dream={dream} />
      ))}
    </div>
  );
};

export default DreamList;
