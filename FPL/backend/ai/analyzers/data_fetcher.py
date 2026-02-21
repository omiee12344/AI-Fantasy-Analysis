"""
FPL Data Fetcher Module

This module handles all data fetching from the Fantasy Premier League API.
Separated from analysis logic to make it easier to cache, mock, or replace data sources.
"""

import requests
import pandas as pd
from typing import Dict, List, Optional, Tuple
import time
from datetime import datetime, timedelta


class FPLDataFetcher:
    """
    Handles fetching data from the Fantasy Premier League API.
    
    This class is responsible for all HTTP requests to the FPL API
    and provides clean, structured data to other components.
    """
    
    def __init__(self, cache_duration: int = 300):
        """
        Initialize the data fetcher.
        
        Args:
            cache_duration: How long to cache data in seconds (default: 5 minutes)
        """
        self.base_url = 'https://fantasy.premierleague.com/api/'
        self.cache_duration = cache_duration
        self._cache = {}
        self._cache_timestamps = {}
        
    def get_bootstrap_data(self, use_cache: bool = True) -> Dict:
        """
        Fetch bootstrap data (players, teams, positions, etc.).
        
        Args:
            use_cache: Whether to use cached data if available
            
        Returns:
            Dict: Bootstrap data from FPL API
        """
        cache_key = 'bootstrap'
        
        if use_cache and self._is_cache_valid(cache_key):
            return self._cache[cache_key]
        
        try:
            response = requests.get(f'{self.base_url}bootstrap-static/', timeout=10)
            response.raise_for_status()
            data = response.json()
            
            self._cache[cache_key] = data
            self._cache_timestamps[cache_key] = time.time()
            
            return data
            
        except requests.RequestException as e:
            print(f"Error fetching bootstrap data: {e}")
            # Return cached data if available, even if expired
            return self._cache.get(cache_key, {})
    
    def get_fixtures_data(self, use_cache: bool = True) -> List[Dict]:
        """
        Fetch fixtures data.
        
        Args:
            use_cache: Whether to use cached data if available
            
        Returns:
            List[Dict]: Fixtures data from FPL API
        """
        cache_key = 'fixtures'
        
        if use_cache and self._is_cache_valid(cache_key):
            return self._cache[cache_key]
        
        try:
            response = requests.get(f'{self.base_url}fixtures/', timeout=10)
            response.raise_for_status()
            data = response.json()
            
            self._cache[cache_key] = data
            self._cache_timestamps[cache_key] = time.time()
            
            return data
            
        except requests.RequestException as e:
            print(f"Error fetching fixtures data: {e}")
            return self._cache.get(cache_key, [])
    
    def get_player_detailed_data(self, player_id: int, use_cache: bool = True) -> Dict:
        """
        Fetch detailed data for a specific player.
        
        Args:
            player_id: FPL player ID
            use_cache: Whether to use cached data if available
            
        Returns:
            Dict: Detailed player data
        """
        cache_key = f'player_{player_id}'
        
        if use_cache and self._is_cache_valid(cache_key):
            return self._cache[cache_key]
        
        try:
            response = requests.get(f'{self.base_url}element-summary/{player_id}/', timeout=10)
            response.raise_for_status()
            data = response.json()
            
            self._cache[cache_key] = data
            self._cache_timestamps[cache_key] = time.time()
            
            return data
            
        except requests.RequestException as e:
            print(f"Error fetching player {player_id} data: {e}")
            return self._cache.get(cache_key, {})
    
    def get_gameweek_data(self, gameweek: int, use_cache: bool = True) -> Dict:
        """
        Fetch data for a specific gameweek.
        
        Args:
            gameweek: Gameweek number
            use_cache: Whether to use cached data if available
            
        Returns:
            Dict: Gameweek data
        """
        cache_key = f'gameweek_{gameweek}'
        
        if use_cache and self._is_cache_valid(cache_key):
            return self._cache[cache_key]
        
        try:
            response = requests.get(f'{self.base_url}event/{gameweek}/live/', timeout=10)
            response.raise_for_status()
            data = response.json()
            
            self._cache[cache_key] = data
            self._cache_timestamps[cache_key] = time.time()
            
            return data
            
        except requests.RequestException as e:
            print(f"Error fetching gameweek {gameweek} data: {e}")
            return self._cache.get(cache_key, {})
    
    def get_players_dataframe(self, include_detailed: bool = False) -> pd.DataFrame:
        """
        Get players data as a pandas DataFrame.
        
        Args:
            include_detailed: Whether to fetch detailed data for each player
            
        Returns:
            pd.DataFrame: Players data
        """
        bootstrap_data = self.get_bootstrap_data()
        
        if not bootstrap_data:
            return pd.DataFrame()
        
        try:
            # Extract players, teams, and positions
            players = bootstrap_data.get('elements', [])
            teams = {team['id']: team for team in bootstrap_data.get('teams', [])}
            positions = {pos['id']: pos for pos in bootstrap_data.get('element_types', [])}
            
            # Convert to DataFrame
            df = pd.DataFrame(players)
            
            if df.empty:
                return df
            
            # Add team and position information
            df['team_name'] = df['team'].map(lambda x: teams.get(x, {}).get('name', ''))
            df['team_short_name'] = df['team'].map(lambda x: teams.get(x, {}).get('short_name', ''))
            df['position_name'] = df['element_type'].map(lambda x: positions.get(x, {}).get('singular_name', ''))
            df['position_short'] = df['element_type'].map(lambda x: positions.get(x, {}).get('singular_name_short', ''))
            
            # Convert price to float (in millions)
            df['price'] = df['now_cost'] / 10.0
            
            # Add derived features
            df['points_per_game'] = df['total_points'] / df['minutes'].replace(0, 1) * 90
            df['value'] = df['total_points'] / df['price'].replace(0, 1)
            df['minutes_per_game'] = df['minutes'] / df['games_played'].replace(0, 1)
            
            return df
            
        except Exception as e:
            print(f"Error creating players DataFrame: {e}")
            return pd.DataFrame()
    
    def get_fixtures_dataframe(self) -> pd.DataFrame:
        """
        Get fixtures data as a pandas DataFrame.
        
        Returns:
            pd.DataFrame: Fixtures data
        """
        fixtures_data = self.get_fixtures_data()
        
        if not fixtures_data:
            return pd.DataFrame()
        
        try:
            df = pd.DataFrame(fixtures_data)
            
            if df.empty:
                return df
            
            # Convert datetime fields
            if 'kickoff_time' in df.columns:
                df['kickoff_time'] = pd.to_datetime(df['kickoff_time'], errors='coerce')
            
            # Add derived features
            df['is_finished'] = df['finished'] == True
            df['has_result'] = (~df['team_h_score'].isna()) & (~df['team_a_score'].isna())
            
            return df
            
        except Exception as e:
            print(f"Error creating fixtures DataFrame: {e}")
            return pd.DataFrame()
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid."""
        if cache_key not in self._cache or cache_key not in self._cache_timestamps:
            return False
        
        age = time.time() - self._cache_timestamps[cache_key]
        return age < self.cache_duration
    
    def clear_cache(self):
        """Clear all cached data."""
        self._cache.clear()
        self._cache_timestamps.clear()
    
    def get_cache_status(self) -> Dict:
        """Get information about current cache status."""
        current_time = time.time()
        status = {}
        
        for key, timestamp in self._cache_timestamps.items():
            age = current_time - timestamp
            status[key] = {
                'age_seconds': int(age),
                'is_valid': age < self.cache_duration,
                'expires_in': max(0, int(self.cache_duration - age))
            }
        
        return status