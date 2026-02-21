import requests
import json
import numpy as np
import pandas as pd
from operator import itemgetter
import copy
from typing import Dict, List, Tuple, Any

class FPLAnalyzer:
    def __init__(self):
        self.base_url = 'https://fantasy.premierleague.com/api/'
        self.bootstrap_data = None
        self.fixtures_data = None
        self.teams = {}
        self.team_id = {}
        
    def fetch_data(self) -> Tuple[Dict, List]:
        """Fetch data from FPL API"""
        try:
            # Get bootstrap data
            bootstrap_response = requests.get(f'{self.base_url}bootstrap-static/')
            bootstrap_response.raise_for_status()
            self.bootstrap_data = bootstrap_response.json()
            
            # Get fixtures data  
            fixtures_response = requests.get(f'{self.base_url}fixtures/')
            fixtures_response.raise_for_status()
            self.fixtures_data = fixtures_response.json()
            
            # Build team mappings
            self.teams = self.bootstrap_data['teams']
            self.team_id = {team['id']: team['name'] for team in self.teams}
            
            return self.bootstrap_data, self.fixtures_data
            
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch FPL data: {str(e)}")
    
    def process_fixtures(self) -> Dict[str, List[float]]:
        """Process fixtures and calculate difficulty ratings"""
        if not self.fixtures_data or not self.team_id:
            raise Exception("Data not loaded. Call fetch_data() first.")
            
        # Group fixtures by gameweek
        fix_list = {}
        for fixture in self.fixtures_data:
            event = fixture.get('event')
            if not event:  # Skip fixtures without gameweek (finished season)
                continue
                
            if event not in fix_list:
                fix_list[event] = []
            
            fix_list[event].append([
                fixture['team_h'],
                fixture['team_a'], 
                fixture['team_h_difficulty'],
                fixture['team_a_difficulty']
            ])
        
        # Build team fixtures dictionary
        team_fix = {}
        for gameweek, fixtures in fix_list.items():
            for home_team, away_team, home_diff, away_diff in fixtures:
                home_name = self.team_id.get(home_team)
                away_name = self.team_id.get(away_team)
                
                if not home_name or not away_name:
                    continue
                
                # Home team fixture
                if home_name not in team_fix:
                    team_fix[home_name] = []
                team_fix[home_name].append([away_name, home_diff, 'Home', gameweek])
                
                # Away team fixture  
                if away_name not in team_fix:
                    team_fix[away_name] = []
                team_fix[away_name].append([home_name, away_diff, 'Away', gameweek])
        
        # Apply custom difficulty adjustments
        team_fix_alt = copy.deepcopy(team_fix)
        newly_promoted = ['Burnley', 'Sheffield Utd', 'Luton']  # Update for current season
        top_teams = ['Liverpool', 'Arsenal', 'Man City', 'Chelsea', 'Newcastle']
        
        for team, fixtures in team_fix_alt.items():
            for fixture in fixtures:
                opponent, difficulty, venue, gameweek = fixture
                
                if venue == 'Away':
                    if team in newly_promoted and opponent in top_teams:
                        fixture[1] = 5
                    elif team in newly_promoted and opponent not in newly_promoted:
                        fixture[1] = 4.5
                else:  # Home
                    if opponent in newly_promoted and team in top_teams:
                        fixture[1] = 1
                    elif opponent in newly_promoted and team not in newly_promoted:
                        fixture[1] = 1.5
        
        # Sort by gameweek and create difficulty arrays
        fix_by_week = {}
        for team, fixtures in team_fix_alt.items():
            sorted_fixtures = sorted(fixtures, key=itemgetter(3))
            fix_by_week[team] = [fixture[1] for fixture in sorted_fixtures]
            
        return fix_by_week
    
    def get_top_teams_with_easiest_fixtures(self, fixtures: Dict[str, List[float]], 
                                          window_size: int = 5, top_n: int = 5) -> List[Dict]:
        """Get teams with easiest fixture runs"""
        num_weeks = 38
        records = []
        
        for start in range(0, num_weeks - window_size + 1, 2):
            end = start + window_size
            avg_difficulties = []
            
            for team, ratings in fixtures.items():
                if len(ratings) >= end:
                    window_ratings = ratings[start:end]
                    window_avg = np.mean(window_ratings)
                    avg_difficulties.append({
                        'team': team,
                        'avg': window_avg,
                        'fixtures': window_ratings
                    })
            
            # Sort by average difficulty (easiest first)
            avg_difficulties.sort(key=lambda x: x['avg'])
            
            # Get top n teams
            top_teams = avg_difficulties[:top_n]
            
            for team_data in top_teams:
                records.append({
                    'window': f'GW{start+1}-{end}',
                    'team': team_data['team'],
                    'avg_difficulty': float(team_data['avg']),
                    'fixtures': [float(f) for f in team_data['fixtures']]
                })
                
        return records
    
    def get_player_data(self, position_filter: str = 'all', 
                       min_price: float = 4.0, max_price: float = 15.0) -> List[Dict]:
        """Get filtered player data with prices"""
        if not self.bootstrap_data:
            raise Exception("Data not loaded. Call fetch_data() first.")
            
        players = self.bootstrap_data['elements']
        teams = {team['id']: team['name'] for team in self.bootstrap_data['teams']}
        positions = {pos['id']: pos['singular_name_short'] 
                    for pos in self.bootstrap_data['element_types']}
        
        processed_players = []
        
        for player in players:
            price = player['now_cost'] / 10.0
            
            # Apply filters
            if position_filter != 'all' and str(player['element_type']) != position_filter:
                continue
                
            if price < min_price or price > max_price:
                continue
            
            processed_players.append({
                'id': player['id'],
                'first_name': player['first_name'],
                'second_name': player['second_name'], 
                'team': teams.get(player['team'], 'Unknown'),
                'position': positions.get(player['element_type'], 'Unknown'),
                'position_id': player['element_type'],
                'price': f"£{price:.1f}m",
                'price_value': price,
                'total_points': player['total_points'],
                'form': float(player['form']) if player['form'] else 0.0,
                'points_per_game': float(player['points_per_game']) if player['points_per_game'] else 0.0,
                'selected_by_percent': float(player['selected_by_percent']) if player['selected_by_percent'] else 0.0,
                'minutes': player['minutes'],
                'goals_scored': player['goals_scored'],
                'assists': player['assists'],
                'clean_sheets': player['clean_sheets']
            })
        
        # Sort by total points (descending)
        processed_players.sort(key=lambda x: x['total_points'], reverse=True)
        
        return processed_players
    
    def analyze_fixtures(self, window_size: int = 5, top_n: int = 5) -> Dict:
        """Complete fixture analysis workflow"""
        try:
            self.fetch_data()
            fixtures = self.process_fixtures()
            analysis = self.get_top_teams_with_easiest_fixtures(fixtures, window_size, top_n)
            
            return {
                'success': True,
                'data': analysis,
                'message': f'Analysis complete for {len(analysis)} fixture windows'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to analyze fixtures'
            }
    
    def analyze_players(self, position_filter: str = 'all', 
                       min_price: float = 4.0, max_price: float = 15.0) -> Dict:
        """Complete player analysis workflow"""
        try:
            if not self.bootstrap_data:
                self.fetch_data()
                
            players = self.get_player_data(position_filter, min_price, max_price)
            
            return {
                'success': True,
                'data': players,
                'message': f'Found {len(players)} players matching criteria'
            }
        except Exception as e:
            return {
                'success': False, 
                'error': str(e),
                'message': 'Failed to analyze players'
            }

    def compare_players_ai(self, player1_data: Dict, player2_data: Dict) -> Dict:
        """
        Generate intelligent AI-powered comparison between two players
        Based on comprehensive statistical analysis of their performance data
        """
        try:
            # Extract key metrics for analysis
            p1 = {
                'name': f"{player1_data.get('first_name', '')} {player1_data.get('second_name', '')}",
                'position': player1_data.get('position', 'Unknown'),
                'team': player1_data.get('team', 'Unknown'),
                'price': player1_data.get('price_value', 0),
                'total_points': player1_data.get('total_points', 0),
                'form': player1_data.get('form', 0),
                'points_per_game': player1_data.get('points_per_game', 0),
                'selected_by_percent': player1_data.get('selected_by_percent', 0),
                'minutes': player1_data.get('minutes', 0),
                'goals_scored': player1_data.get('goals_scored', 0),
                'assists': player1_data.get('assists', 0),
                'clean_sheets': player1_data.get('clean_sheets', 0)
            }
            
            p2 = {
                'name': f"{player2_data.get('first_name', '')} {player2_data.get('second_name', '')}",
                'position': player2_data.get('position', 'Unknown'),
                'team': player2_data.get('team', 'Unknown'),
                'price': player2_data.get('price_value', 0),
                'total_points': player2_data.get('total_points', 0),
                'form': player2_data.get('form', 0),
                'points_per_game': player2_data.get('points_per_game', 0),
                'selected_by_percent': player2_data.get('selected_by_percent', 0),
                'minutes': player2_data.get('minutes', 0),
                'goals_scored': player2_data.get('goals_scored', 0),
                'assists': player2_data.get('assists', 0),
                'clean_sheets': player2_data.get('clean_sheets', 0)
            }
            
            # Calculate advanced metrics
            p1['value_ratio'] = p1['points_per_game'] / (p1['price'] / 10) if p1['price'] > 0 else 0
            p2['value_ratio'] = p2['points_per_game'] / (p2['price'] / 10) if p2['price'] > 0 else 0
            
            p1['consistency'] = p1['form'] / p1['points_per_game'] if p1['points_per_game'] > 0 else 0
            p2['consistency'] = p2['form'] / p2['points_per_game'] if p2['points_per_game'] > 0 else 0
            
            # Generate intelligent analysis
            analysis = {
                'summary': self._generate_summary(p1, p2),
                'detailed_analysis': self._generate_detailed_analysis(p1, p2),
                'recommendations': self._generate_recommendations(p1, p2),
                'metrics_comparison': self._generate_metrics_comparison(p1, p2),
                'position_specific': self._generate_position_specific_analysis(p1, p2)
            }
            
            return {
                'success': True,
                'data': analysis,
                'message': f'AI comparison analysis generated for {p1["name"]} vs {p2["name"]}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to generate AI comparison'
            }

    def _generate_summary(self, p1: Dict, p2: Dict) -> str:
        """Generate executive summary of the comparison"""
        # Determine overall winner based on multiple factors
        p1_score = 0
        p2_score = 0
        
        # Points scoring
        if p1['total_points'] > p2['total_points']:
            p1_score += 2
        elif p2['total_points'] > p1['total_points']:
            p2_score += 2
            
        # Form
        if p1['form'] > p2['form']:
            p1_score += 2
        elif p2['form'] > p1['form']:
            p2_score += 2
            
        # Value
        if p1['value_ratio'] > p2['value_ratio']:
            p1_score += 1
        elif p2['value_ratio'] > p1['value_ratio']:
            p2_score += 1
            
        # Consistency
        if p1['consistency'] > p2['consistency']:
            p1_score += 1
        elif p2['consistency'] > p1['consistency']:
            p2_score += 1
            
        if p1_score > p2_score:
            winner = p1['name']
            margin = "slightly" if abs(p1_score - p2_score) <= 1 else "clearly"
        elif p2_score > p1_score:
            winner = p2['name']
            margin = "slightly" if abs(p2_score - p1_score) <= 1 else "clearly"
        else:
            winner = "Both players"
            margin = "equally"
            
        return f"{winner} {margin} outperforms the other based on overall performance metrics."

    def _generate_detailed_analysis(self, p1: Dict, p2: Dict) -> str:
        """Generate detailed statistical analysis"""
        analysis = []
        
        # Points analysis
        points_diff = abs(p1['total_points'] - p2['total_points'])
        if points_diff > 20:
            better_player = p1['name'] if p1['total_points'] > p2['total_points'] else p2['name']
            analysis.append(f"📊 **Season Performance**: {better_player} has scored {points_diff} more points this season, showing significantly better consistency.")
        elif points_diff > 10:
            analysis.append(f"📊 **Season Performance**: {p1['name']} leads by {points_diff} points, indicating a moderate advantage.")
        else:
            analysis.append(f"📊 **Season Performance**: Both players are very close in total points ({points_diff} difference), suggesting similar season-long value.")
        
        # Form analysis
        form_diff = abs(p1['form'] - p2['form'])
        if form_diff > 2:
            better_form = p1['name'] if p1['form'] > p2['form'] else p2['name']
            analysis.append(f"📈 **Current Form**: {better_form} is in significantly better form ({form_diff:.1f} points difference), indicating recent momentum.")
        elif form_diff > 1:
            analysis.append(f"📈 **Current Form**: {p1['name']} has slightly better recent form, though the difference is marginal.")
        else:
            analysis.append(f"📈 **Current Form**: Both players show similar recent form levels.")
        
        # Value analysis
        value_diff = abs(p1['value_ratio'] - p2['value_ratio'])
        if value_diff > 0.5:
            better_value = p1['name'] if p1['value_ratio'] > p2['value_ratio'] else p2['name']
            analysis.append(f"💰 **Value for Money**: {better_value} offers significantly better returns per million spent ({value_diff:.2f} difference).")
        else:
            analysis.append(f"💰 **Value for Money**: Both players offer similar value relative to their price.")
        
        # Playing time analysis
        if p1['minutes'] > 0 and p2['minutes'] > 0:
            minutes_diff = abs(p1['minutes'] - p2['minutes'])
            if minutes_diff > 500:
                more_playing = p1['name'] if p1['minutes'] > p2['minutes'] else p2['name']
                analysis.append(f"⏱️ **Playing Time**: {more_playing} has played {minutes_diff//90} more full games, indicating better squad security.")
        
        return "\n\n".join(analysis)

    def _generate_recommendations(self, p1: Dict, p2: Dict) -> str:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Price-based recommendations
        price_diff = abs(p1['price'] - p2['price'])
        if price_diff > 2:
            cheaper = p1['name'] if p1['price'] < p2['price'] else p2['name']
            more_expensive = p1['name'] if p1['price'] > p2['price'] else p2['name']
            recommendations.append(f"💡 **Budget Consideration**: {cheaper} offers similar performance at £{price_diff:.1f}m less, potentially freeing up funds for other positions.")
        
        # Form-based recommendations
        if p1['form'] > p2['form'] + 1:
            recommendations.append(f"🔥 **Form Pick**: {p1['name']} is in significantly better form and could be a strong differential pick.")
        elif p2['form'] > p1['form'] + 1:
            recommendations.append(f"🔥 **Form Pick**: {p2['name']} is in significantly better form and could be a strong differential pick.")
        
        # Ownership-based recommendations
        ownership_diff = abs(p1['selected_by_percent'] - p2['selected_by_percent'])
        if ownership_diff > 10:
            lower_owned = p1['name'] if p1['selected_by_percent'] < p2['selected_by_percent'] else p2['name']
            higher_owned = p1['name'] if p1['selected_by_percent'] > p2['selected_by_percent'] else p2['name']
            recommendations.append(f"👥 **Differential Strategy**: {lower_owned} has {ownership_diff:.1f}% lower ownership than {higher_owned}, offering potential for unique team composition.")
        
        if not recommendations:
            recommendations.append("💡 **Balanced Choice**: Both players offer similar value propositions. Consider team structure and fixture schedule for the final decision.")
        
        return "\n\n".join(recommendations)

    def _generate_metrics_comparison(self, p1: Dict, p2: Dict) -> Dict:
        """Generate detailed metrics comparison"""
        return {
            'points': {
                'player1': p1['total_points'],
                'player2': p2['total_points'],
                'difference': p1['total_points'] - p2['total_points'],
                'winner': p1['name'] if p1['total_points'] > p2['total_points'] else p2['name']
            },
            'form': {
                'player1': p1['form'],
                'player2': p2['form'],
                'difference': p1['form'] - p2['form'],
                'winner': p1['name'] if p1['form'] > p2['form'] else p2['name']
            },
            'value_ratio': {
                'player1': p1['value_ratio'],
                'player2': p2['value_ratio'],
                'difference': p1['value_ratio'] - p2['value_ratio'],
                'winner': p1['name'] if p1['value_ratio'] > p2['value_ratio'] else p2['name']
            },
            'consistency': {
                'player1': p1['consistency'],
                'player2': p2['consistency'],
                'difference': p1['consistency'] - p2['consistency'],
                'winner': p1['name'] if p1['consistency'] > p2['consistency'] else p2['name']
            }
        }

    def _generate_position_specific_analysis(self, p1: Dict, p2: Dict) -> str:
        """Generate position-specific insights"""
        if p1['position'] != p2['position']:
            return f"⚠️ **Position Mismatch**: Comparing {p1['position']} vs {p2['position']} may not be optimal. Consider comparing players in the same position for better insights."
        
        position = p1['position']
        
        if position == 'Forward':
            # Analyze goal-scoring and assists
            goals_diff = p1['goals_scored'] - p2['goals_scored']
            if abs(goals_diff) > 3:
                better_scorer = p1['name'] if goals_diff > 0 else p2['name']
                return f"⚽ **Goal Threat**: {better_scorer} has scored {abs(goals_diff)} more goals, making them the primary goal threat."
            else:
                return f"⚽ **Goal Threat**: Both forwards show similar goal-scoring ability this season."
                
        elif position == 'Midfielder':
            # Analyze assists and overall contribution
            assists_diff = p1['assists'] - p2['assists']
            if abs(assists_diff) > 2:
                better_assister = p1['name'] if assists_diff > 0 else p2['name']
                return f"🎯 **Creative Output**: {better_assister} has {abs(assists_diff)} more assists, indicating better creative contribution."
            else:
                return f"🎯 **Creative Output**: Both midfielders show similar creative output this season."
                
        elif position == 'Defender':
            # Analyze clean sheets and defensive contribution
            cs_diff = p1['clean_sheets'] - p2['clean_sheets']
            if abs(cs_diff) > 2:
                better_defender = p1['name'] if cs_diff > 0 else p2['name']
                return f"🛡️ **Defensive Stability**: {better_defender} has {abs(cs_diff)} more clean sheets, indicating better defensive returns."
            else:
                return f"🛡️ **Defensive Stability**: Both defenders show similar clean sheet potential this season."
                
        else:  # Goalkeeper
            # Analyze clean sheets and save points
            cs_diff = p1['clean_sheets'] - p2['clean_sheets']
            if abs(cs_diff) > 2:
                better_gk = p1['name'] if cs_diff > 0 else p2['name']
                return f"🧤 **Clean Sheet Potential**: {better_gk} has {abs(cs_diff)} more clean sheets, indicating better defensive team performance."
            else:
                return f"🧤 **Clean Sheet Potential**: Both goalkeepers show similar clean sheet potential this season."

# Example usage and testing
if __name__ == "__main__":
    analyzer = FPLAnalyzer()
    
    print("Testing FPL Analyzer...")
    
    # Test fixture analysis
    print("\n1. Testing Fixture Analysis:")
    fixture_result = analyzer.analyze_fixtures(window_size=5, top_n=5)
    if fixture_result['success']:
        print(f"✅ {fixture_result['message']}")
        print(f"Sample result: {fixture_result['data'][0] if fixture_result['data'] else 'No data'}")
    else:
        print(f"❌ {fixture_result['message']}: {fixture_result.get('error', '')}")
    
    # Test player analysis
    print("\n2. Testing Player Analysis:")
    player_result = analyzer.analyze_players(position_filter='all', min_price=4.0, max_price=15.0)
    if player_result['success']:
        print(f"✅ {player_result['message']}")
        if player_result['data']:
            top_player = player_result['data'][0]
            print(f"Top player: {top_player['first_name']} {top_player['second_name']} - {top_player['price']} ({top_player['total_points']} pts)")
    else:
        print(f"❌ {player_result['message']}: {player_result.get('error', '')}")
    
    print("\n✅ FPL Analyzer testing complete!")