import React from 'react'
import ResourceCard from './ResourceCard'
import { resourcesData } from '../data/resources'
import './Resources.css'

const Resources = () => {
  return (
    <section id="resources" className="resources">
      <div className="resources-container">
        <div className="section-header">
          <h2 className="section-title">精選資源</h2>
          <p className="section-description">
            我們精心挑選了最實用的工具和資源，幫助你的新創公司快速成長
          </p>
        </div>

        <div className="resources-grid">
          {resourcesData.map((category) => (
            <div key={category.id} className="resource-category">
              <h3 className="category-title">
                <span className="category-icon">{category.icon}</span>
                {category.name}
              </h3>
              <div className="category-items">
                {category.items.map((item) => (
                  <ResourceCard key={item.id} resource={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Resources

