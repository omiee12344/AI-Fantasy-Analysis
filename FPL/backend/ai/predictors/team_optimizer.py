"""
Team Optimization Module

This module contains algorithms for creating optimal FPL teams.
Separated from the ML model to allow for different optimization strategies.
"""

from typing import Dict, List, Any
import numpy as np


class TeamOptimizer:
    """
    Handles team optimization logic for Fantasy Premier League.
    
    This class is responsible for selecting the best 15-player team
    within budget constraints and FPL formation rules.
    """
    
    def __init__(self):
        self.formation_limits = {
            'GKP': {'min': 2, 'max': 2},
            'DEF': {'min': 5, 'max': 5}, 
            'MID': {'min': 5, 'max': 5},
            'FWD': {'min': 3, 'max': 3}
        }
        self.team_limits = 3  # Max 3 players from same team
        
    def optimize_team(self, players: List[Dict], budget: float = 100.0) -> Dict:
        """
        Create an optimized team based on predicted points and budget.
        
        Args:
            players: List of player dictionaries with predictions
            budget: Total budget in millions
            
        Returns:
            Dict: Optimized team with players and statistics
        """
        try:
            # Validate inputs
            if not players:
                return {'success': False, 'error': 'No players provided'}
            
            if budget <= 0:
                return {'success': False, 'error': 'Invalid budget'}
            
            # Convert budget from millions to FPL units (multiply by 10)
            budget_units = int(budget * 10)
            
            # Group players by position
            players_by_pos = self._group_by_position(players)
            
            # Select players for each position
            selected_team = []
            total_cost = 0
            
            for position, limits in self.formation_limits.items():
                pos_players = players_by_pos.get(position, [])
                if len(pos_players) < limits['min']:
                    return {
                        'success': False, 
                        'error': f'Not enough {position} players available'
                    }
                
                # Sort by adjusted predicted points (descending)
                pos_players.sort(key=lambda x: x.get('adjusted_predicted_points', 0), reverse=True)
                
                # Select required number of players for this position
                selected_count = 0
                for player in pos_players:
                    if selected_count >= limits['max']:
                        break
                        
                    player_cost = int(player.get('now_cost', 0))
                    if total_cost + player_cost <= budget_units:
                        # Check team limits
                        if self._check_team_limits(selected_team, player):
                            selected_team.append(player)
                            total_cost += player_cost
                            selected_count += 1
                
                # Check if we have minimum required players for this position
                if selected_count < limits['min']:
                    return {
                        'success': False,
                        'error': f'Cannot afford minimum {limits["min"]} {position} players within budget'
                    }
            
            # Calculate team statistics
            stats = self._calculate_team_stats(selected_team, total_cost)
            
            return {
                'success': True,
                'team': selected_team,
                'stats': stats,
                'formation': self._get_formation_summary(selected_team)
            }
            
        except Exception as e:
            return {'success': False, 'error': f'Team optimization failed: {str(e)}'}
    
    def _group_by_position(self, players: List[Dict]) -> Dict[str, List[Dict]]:
        """Group players by their position."""
        position_map = {1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD'}
        grouped = {pos: [] for pos in position_map.values()}
        
        for player in players:
            pos_id = player.get('element_type')
            pos_name = position_map.get(pos_id)
            if pos_name:
                grouped[pos_name].append(player)
                
        return grouped
    
    def _check_team_limits(self, current_team: List[Dict], new_player: Dict) -> bool:
        """Check if adding a new player would violate team limits."""
        new_team_id = new_player.get('team')
        team_count = sum(1 for p in current_team if p.get('team') == new_team_id)
        return team_count < self.team_limits
    
    def _calculate_team_stats(self, team: List[Dict], total_cost: int) -> Dict:
        """Calculate statistics for the selected team."""
        total_predicted_points = sum(
            p.get('adjusted_predicted_points', 0) for p in team
        )
        
        # Convert cost back to millions
        total_cost_millions = total_cost / 10.0
        
        return {
            'total_predicted_points': round(total_predicted_points, 2),
            'total_cost': total_cost_millions,
            'remaining_budget': round(100.0 - total_cost_millions, 1),
            'players_count': len(team),
            'average_predicted_points': round(total_predicted_points / len(team), 2) if team else 0
        }
    
    def _get_formation_summary(self, team: List[Dict]) -> Dict:
        """Get formation breakdown of the selected team."""
        position_map = {1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD'}
        formation = {pos: 0 for pos in position_map.values()}
        
        for player in team:
            pos_id = player.get('element_type')
            pos_name = position_map.get(pos_id)
            if pos_name:
                formation[pos_name] += 1
                
        return formation
    
    def generate_multiple_strategies(self, players: List[Dict], 
                                   budget: float = 100.0, 
                                   num_strategies: int = 3) -> Dict:
        """
        Generate multiple team strategies with different approaches.
        
        Args:
            players: List of player dictionaries
            budget: Total budget in millions
            num_strategies: Number of different strategies to generate
            
        Returns:
            Dict: Multiple team strategies
        """
        strategies = []
        
        try:
            # Strategy 1: Pure predicted points optimization
            team1 = self.optimize_team(players, budget)
            if team1['success']:
                team1['strategy_name'] = 'Max Predicted Points'
                team1['strategy_description'] = 'Optimized for highest predicted points'
                strategies.append(team1)
            
            # Strategy 2: Value-focused (points per million)
            value_players = self._calculate_value_players(players)
            team2 = self.optimize_team(value_players, budget)
            if team2['success']:
                team2['strategy_name'] = 'Best Value'
                team2['strategy_description'] = 'Optimized for points per million spent'
                strategies.append(team2)
            
            # Strategy 3: Balanced approach
            balanced_players = self._calculate_balanced_players(players)
            team3 = self.optimize_team(balanced_players, budget)
            if team3['success']:
                team3['strategy_name'] = 'Balanced'
                team3['strategy_description'] = 'Balanced approach combining points and value'
                strategies.append(team3)
            
            return {
                'success': True,
                'strategies': strategies[:num_strategies],
                'message': f'Generated {len(strategies)} team strategies'
            }
            
        except Exception as e:
            return {'success': False, 'error': f'Strategy generation failed: {str(e)}'}
    
    def _calculate_value_players(self, players: List[Dict]) -> List[Dict]:
        """Calculate value-adjusted scores for players."""
        value_players = []
        for player in players.copy():
            predicted_points = player.get('adjusted_predicted_points', 0)
            price = player.get('now_cost', 40) / 10.0  # Convert to millions
            
            # Calculate points per million
            value_score = predicted_points / max(price, 4.0)  # Avoid division by very small numbers
            
            player_copy = player.copy()
            player_copy['adjusted_predicted_points'] = value_score
            value_players.append(player_copy)
            
        return value_players
    
    def _calculate_balanced_players(self, players: List[Dict]) -> List[Dict]:
        """Calculate balanced scores combining points and value."""
        balanced_players = []
        for player in players.copy():
            predicted_points = player.get('adjusted_predicted_points', 0)
            price = player.get('now_cost', 40) / 10.0
            
            # Balanced score: 70% predicted points + 30% value
            value_score = predicted_points / max(price, 4.0)
            balanced_score = (0.7 * predicted_points) + (0.3 * value_score * 3.0)
            
            player_copy = player.copy()
            player_copy['adjusted_predicted_points'] = balanced_score
            balanced_players.append(player_copy)
            
        return balanced_players