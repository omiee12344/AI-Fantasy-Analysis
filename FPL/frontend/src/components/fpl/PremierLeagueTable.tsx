// src/components/fpl/PremierLeagueTable.tsx

import { useEffect, useState } from 'react';
import API from '@/lib/api';

// Define the structure for each team's data in the table
type TeamStanding = {
  position: number;
  shortName: string;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};


// Add 'showTitle' prop to the component
export default function PremierLeagueTable({ showAll = true, showTitle = true }: { showAll?: boolean, showTitle?: boolean }) {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.table();
        setStandings(response.standings);
      } catch (err: any) {
        console.error('Failed to fetch Premier League table:', err);
        setError(err?.message || 'Failed to load table data');
        setStandings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, []);

  const getPositionClass = (position: number) => {
    if (position <= 4) return 'bg-blue-500'; // Champions League
    if (position === 5) return 'bg-orange-500'; // Europa League
    if (position >= 18) return 'bg-red-600'; // Relegation
    return 'bg-transparent';
  };

  if (loading) {
    return (
      <div className="h-full">
        <div className="animate-pulse">
          {showTitle && <div className="h-6 w-32 bg-white/20 rounded mb-4" />}
          <div className="space-y-2">
            {[...Array(showAll ? 20 : 6)].map((_, i) => (
              <div key={i} className="h-8 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full">
        {showTitle && <h2 className="pl-heading text-2xl text-accent font-bold tracking-widest uppercase mb-4">Premier League</h2>}
        <p className="text-red-300 text-sm">Failed to load table: {error}</p>
      </div>
    );
  }
  
  const tableTitle = showAll ? 'Premier League' : 'Top 6 Clubs';
  const displayedStandings = showAll ? standings : standings.slice(0, 6);

  return (
    <div className="h-full">
      {showTitle && <h2 className="pl-heading text-2xl text-accent font-bold tracking-widest uppercase mb-4">{tableTitle}</h2>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-white/70 uppercase">
            <tr>
              <th scope="col" className="pr-2 py-2 w-4"></th>
              <th scope="col" className="px-6 py-2">Club</th>
              <th scope="col" className="px-2 py-2 text-center">Pl</th>
              <th scope="col" className="px-2 py-2 text-center">GD</th>
              <th scope="col" className="px-2 py-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {displayedStandings.map((team) => (
              <tr key={team.shortName} className="border-b border-white/10 last:border-b-0">
                <td className="pr-2 py-2 align-middle">
                  <div className={`w-1 h-4 rounded-full ${getPositionClass(team.position)}`}></div>
                </td>
                <td scope="row" className="px-6 py-2 font-medium text-white flex items-center">
                  <span className="w-6 text-center mr-4">{team.position}</span>
                  <img src={`/logos/${team.shortName}.png`} alt={team.shortName} className="w-5 h-5 mr-3" />
                  {team.shortName}
                </td>
                <td className="px-2 py-2 text-center align-middle">{team.played}</td>
                <td className="px-2 py-2 text-center align-middle">{team.goalDifference}</td>
                <td className="px-2 py-2 text-center font-bold align-middle">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}