import React from 'react';

const EntityCard = ({ entity, onEntityClick }) => {
  const getEntityCategoryColor = (category) => {
    const colors = {
      'DISEASE_CONDITION': 'entity-disease',
      'SYMPTOM': 'entity-symptom',
      'MEDICATION': 'entity-medication',
      'LAB_RESULT': 'entity-lab',
      'PROCEDURE': 'entity-procedure',
      'OTHER': 'entity-other',
    };
    return colors[category] || 'entity-other';
  };

  const getEntityCategoryIcon = (category) => {
    const icons = {
      'DISEASE_CONDITION': '🦠',
      'SYMPTOM': '🤒',
      'MEDICATION': '💊',
      'LAB_RESULT': '🧪',
      'PROCEDURE': '🏥',
      'OTHER': '📋',
    };
    return icons[category] || '📋';
  };

  return (
    <div 
      className={`card cursor-pointer hover:shadow-md transition-shadow duration-200 ${
        entity.negated ? 'opacity-60' : ''
      }`}
      onClick={() => onEntityClick && onEntityClick(entity)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-2xl">{getEntityCategoryIcon(entity.category)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className={`text-lg font-medium ${entity.negated ? 'line-through' : ''}`}>
              {entity.text}
            </h3>
            <span className={`entity-badge ${getEntityCategoryColor(entity.category)}`}>
              {entity.category.replace('_', ' ')}
            </span>
            {entity.negated && (
              <span className="entity-badge bg-red-100 text-red-800">
                Negated
              </span>
            )}
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Label:</span>
              <span className="font-medium">{entity.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Confidence:</span>
              <span className="font-medium">{(entity.confidence * 100).toFixed(1)}%</span>
            </div>
            {entity.dosage && (
              <div className="flex items-center justify-between">
                <span>Dosage:</span>
                <span className="font-medium">{entity.dosage}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Source:</span>
              <span className="font-medium">{entity.source}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityCard;
