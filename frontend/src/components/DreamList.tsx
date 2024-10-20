import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { formatDate } from '../helpers/date';
import { getUserPhoneNumber } from '../helpers/user';

import 'ldrs/ring';
import {DreamHeatmap} from './HeatMap';

interface Dream {
  id: string;
  createdAt: string;
  dream_content: string;
  response: string;
  summary: string;
}

interface DreamContentProps {
  dream: Dream;
}

const DreamContent: React.FC<DreamContentProps> = ({ dream }) => {
  const [isOpen, setIsOpen] = useState(false);
  const date = formatDate(dream.createdAt);
  const summary = dream.summary?.split("\n\n")[0];
  const themes = dream.summary?.split("\n\n")[1];

  return (
    <div
      className='dream-container dream'
      style={{ padding: ".25rem", marginBottom: "1rem", borderRadius: "5px" }}
      key={dream.id}
      onClick={() => !isOpen && setIsOpen(true)}
    >
      <div style={{ display: "flex" }}>
        <div style={{ marginLeft: "1rem", marginTop: ".5rem" }}><p>{summary}</p><p>{date}</p></div>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? "hide" : "show"}</button>
        </div>
      </div>
      {isOpen && (
        <>
          <div style={{ padding: ".5rem", marginBottom: ".25rem" }}>
            <h3>Your dream</h3>
            <p>{dream.dream_content}</p>
          </div>

          <div style={{ padding: ".5rem", marginBottom: ".25rem" }}>
            <h3>Response</h3>
            <div>
              <p>{dream.response}</p>
            </div>
          </div>

          {themes ? (<div>
            <h3>Themes</h3>
            <ul>
              {themes.split("\n").map(theme => <li key={theme}>{theme.replace("-", "")}</li>)}
            </ul>
          </div>) : null}

        </>
      )}
    </div>
  );
};

const DreamList: React.FC = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);

  useEffect(() => {
    const fetchDreams = async () => {
      const session = await fetchAuthSession();
      const phoneNumber = await getUserPhoneNumber();
      if (!phoneNumber) {
        console.error("No phone number");
        return;
      }
      const url = "https://api.clarasdreamguide.com";
      // const url = 'https://dreammentor-dev.us-east-1.elasticbeanstalk.com'
      // const url = "http://localhost:8888"
      try {
        const response = await fetch(`${url}/api/dreams/${phoneNumber.replace("+", "")}`,
          { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } }
        );
        const data = await response.json();

        let dreamFiles: Dream[] = [];
        for (let i = 0; i < data.length; i++) {
          const key = data[i]["key"];
          if (key.includes("metadata") || key.includes("themes")) {
            continue;
          }
          const response = await fetch(`${url}/api/dreams/${key}`,
            { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } });
          const dreamData: Dream = await response.json();

          dreamFiles = [...dreamFiles, dreamData];
          setDreams(dreamFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch (error) {
        console.error("Error fetching dreams:", error);
      }
    };

    fetchDreams();
  }, []);

  return (
    <div style={{ padding: ".5rem" }}>
      <h2>Dream Journal</h2>
      {dreams.length === 0 && <p>loading...</p>}
      <DreamHeatmap dreams={dreams} /> 
      {dreams.map(dream => (
        <DreamContent key={dream.id} dream={dream} />
      ))}
    </div>
  );
};

export default DreamList;
