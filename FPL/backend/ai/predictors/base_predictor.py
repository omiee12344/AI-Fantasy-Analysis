"""
Base Predictor Class

This module provides the base class for all FPL prediction models.
Future ML models should inherit from this base to ensure consistency.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any
import pandas as pd


class BasePredictor(ABC):
    """
    Abstract base class for all FPL predictors.
    
    This class defines the interface that all prediction models should implement,
    making it easy to swap between different ML models in the future.
    """
    
    def __init__(self):
        self.is_trained = False
        self.model = None
    
    @abstractmethod
    def train(self, data: pd.DataFrame) -> bool:
        """
        Train the prediction model on the given data.
        
        Args:
            data: Training data as pandas DataFrame
            
        Returns:
            bool: True if training was successful, False otherwise
        """
        pass
    
    @abstractmethod
    def predict(self, data: pd.DataFrame) -> List[float]:
        """
        Make predictions on the given data.
        
        Args:
            data: Input data for predictions as pandas DataFrame
            
        Returns:
            List[float]: Predicted values
        """
        pass
    
    @abstractmethod
    def save_model(self, filepath: str) -> bool:
        """
        Save the trained model to disk.
        
        Args:
            filepath: Path where to save the model
            
        Returns:
            bool: True if save was successful, False otherwise
        """
        pass
    
    @abstractmethod
    def load_model(self, filepath: str) -> bool:
        """
        Load a trained model from disk.
        
        Args:
            filepath: Path to the saved model
            
        Returns:
            bool: True if load was successful, False otherwise
        """
        pass
    
    @abstractmethod
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores from the model.
        
        Returns:
            Dict[str, float]: Feature names mapped to importance scores
        """
        pass
    
    def validate(self, test_data: pd.DataFrame) -> Dict[str, float]:
        """
        Validate the model performance on test data.
        
        Args:
            test_data: Test data as pandas DataFrame
            
        Returns:
            Dict[str, float]: Performance metrics
        """
        # Default implementation - can be overridden by subclasses
        return {"validation_score": 0.0}
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model.
        
        Returns:
            Dict[str, Any]: Model information
        """
        return {
            "is_trained": self.is_trained,
            "model_type": self.__class__.__name__,
            "features_count": len(getattr(self, 'feature_columns', [])),
        }