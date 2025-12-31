import React from 'react'
import './ResourceCard.css'

const ResourceCard = ({ resource }) => {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="resource-card"
    >
      <div className="card-header">
        <span className="card-emoji">{resource.emoji}</span>
        <h4 className="card-title">{resource.name}</h4>
      </div>
      <p className="card-description">{resource.description}</p>
      <div className="card-footer">
        <span className="card-tag">{resource.tag}</span>
        <span className="card-arrow">→</span>
      </div>
    </a>
  )
}

export default ResourceCard

