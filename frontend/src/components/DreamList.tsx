import React, { useState, useEffect } from 'react';
import { formatDate } from '../helpers/date';
import { getUserPhoneNumber } from '../helpers/user';

import 'ldrs/ring';

interface Dream {
  id: string;
  createdAt: string;
  dream_content: string;
  response: string;
}

interface DreamContentProps {
  dream: Dream;
}

const DreamContent: React.FC<DreamContentProps> = ({ dream }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{ backgroundColor: "rgb(0 0 0 / 50%)", padding: ".25rem", marginBottom: "1rem", borderRadius: "5px" }}
      key={dream.id}
      onClick={() => !isOpen && setIsOpen(true)}
    >
      <div style={{ display: "flex" }}>
        <div style={{ marginLeft: "1rem", marginTop: ".5rem" }}>{formatDate(dream.createdAt)}</div>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? "hide" : "show"}</button>
        </div>
      </div>
      {isOpen && (
        <>
          <div style={{ backgroundColor: "rgb(0 0 0 / 50%)", padding: ".5rem", marginBottom: ".25rem" }}>
            <h3>Your dream</h3>
            <p>{dream.dream_content}</p>
          </div>

          <div style={{ backgroundColor: "rgb(47 47 47 / 50%)", padding: ".5rem", marginBottom: ".25rem" }}>
            <h3>Response</h3>
            <p>{dream.response}</p>
          </div>
        </>
      )}
    </div>
  );
};

const DreamList: React.FC = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);

  useEffect(() => {
    const fetchDreams = async () => {
      const phoneNumber = await getUserPhoneNumber();
      if (!phoneNumber) {
        console.error("No phone number");
        return;
      }
      const url =  "dreammentor-dev.us-east-1.elasticbeanstalk.com";
      // const url = "localhost:8000"
      try {
        const response = await fetch(`https://${url}/api/dreams/${phoneNumber.replace("+", "")}`);
        const data = await response.json();

        let dreamFiles: Dream[] = [];
        for (let i = 0; i < data.length; i++) {
          const key = data[i]["key"];
          if (key.includes("metadata")) {
            continue;
          }
          const response = await fetch(`https://${url}/api/dreams/${key}`);
          const dreamData: Dream = await response.json();

          dreamFiles = [...dreamFiles, dreamData];
        }

        setDreams(dreamFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Error fetching dreams:", error);
      }
    };

    fetchDreams();
  }, []);

  return (
    <div style={{ padding: ".5rem" }}>
      <h2>Your Dreams</h2>
      {dreams.length === 0 && <p>loading...</p>}
      {dreams.map(dream => (
        <DreamContent key={dream.id} dream={dream} />
      ))}
    </div>
  );
};

export default DreamList;
