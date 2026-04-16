import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HiOutlineGlobe, 
  HiOutlineChartBar, 
  HiOutlineUsers, 
  HiOutlineCash,
  HiOutlineShieldCheck,
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineArrowRight,
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup
} from 'react-icons/hi';

const About = () => {
  const stats = [
    { value: '$2.5B+', label: 'Active Contracts', icon: HiOutlineCash },
    { value: '15+', label: 'Years of Excellence', icon: HiOutlineClock },
    { value: '5,000+', label: 'Workforce Global', icon: HiOutlineUsers },
    { value: '12', label: 'Countries Active', icon: HiOutlineGlobe }
  ];

  const subsidiaries = [
    {
      name: 'Barminco',
      location: 'Australia',
      description: 'Our Australian flagship subsidiary delivering world-class underground mining services with a strong focus on safety, innovation, and operational excellence.',
      highlights: [
        'Deep expertise in hard-rock underground mining',
        'Industry-leading safety record',
        'Long-term relationships with major gold producers',
        'Recent contract extensions in Western Australia'
      ]
    },
    {
      name: 'AUMS',
      location: 'African Underground Mining Services',
      description: 'Strategic expansion into Africa\'s most promising mining jurisdictions, delivering exceptional results through our proven joint venture model.',
      highlights: [
        'Landmark $1.1B contract in Burkina Faso',
        'Significant operations in Ghana',
        'Strong relationships with African mining authorities',
        'Local expertise combined with global standards'
      ]
    }
  ];

  const contracts = [
    {
      region: 'Burkina Faso',
      value: '$1.1B',
      partner: 'Joint Venture',
      description: 'Landmark contract demonstrating our West African dominance and JV model success.',
      icon: HiOutlineLocationMarker
    },
    {
      region: 'Ghana',
      value: 'Major Operations',
      partner: 'Direct Contract',
      description: 'Significant underground mining operations with major gold producers.',
      icon: HiOutlineOfficeBuilding
    },
    {
      region: 'Western Australia',
      value: 'Long-term Extensions',
      partner: 'Barminco',
      description: 'Continued growth and expansion in the world\'s premier mining jurisdiction.',
      icon: HiOutlineTrendingUp
    }
  ];

  const values = [
    {
      title: 'Operational Excellence',
      description: 'Through our subsidiaries Barminco and AUMS, we deliver world-class underground mining solutions with unmatched safety records and operational efficiency.',
      icon: HiOutlineChartBar
    },
    {
      title: 'Strategic Partnerships',
      description: 'Our joint venture model, particularly in Burkina Faso, demonstrates our ability to forge powerful partnerships that deliver exceptional value.',
      icon: HiOutlineUserGroup
    },
    {
      title: 'Long-term Vision',
      description: 'With massive, decade-long contracts spanning multiple continents, we provide stability and predictable growth for our partners and shareholders.',
      icon: HiOutlineTrendingUp
    },
    {
      title: 'Shareholder Value',
      description: 'As an ASX300 company, we offer index fund exposure with a compelling dividend policy targeting 30-40% payout, with direct exposure to gold price upside.',
      icon: HiOutlineCash
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white">
      {/* Hero Section - Blue Background */}
      <section className="relative bg-gradient-to-br from-primestone-600 to-primestone-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6 text-[#FFD700]">
              Global Mining Services Excellence
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Through our subsidiaries Barminco (Australia) and African Underground Mining Services (AUMS), 
              we deliver world-class underground mining solutions with a strong focus on operational excellence 
              and shareholder value.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/investments" className="bg-white text-primestone-600 px-8 py-4 rounded-lg font-semibold hover:bg-primestone-50 transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
                Explore Investment Opportunities
                <HiOutlineArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primestone-100 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-primestone-600" />
                </div>
                <div className="text-3xl font-bold text-primestone-900">{stat.value}</div>
                <div className="text-sm text-neutral-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gradient-to-b from-primestone-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Built on a foundation of safety, innovation, and operational excellence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-primestone-100 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primestone-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primestone-900">{value.title}</h3>
                <p className="text-neutral-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Subsidiaries */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900 mb-4">
              Our Global Operations
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Delivering excellence through our specialized subsidiaries
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {subsidiaries.map((sub, index) => (
              <div key={index} className="bg-gradient-to-br from-primestone-50 to-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-primestone-900 mb-2">{sub.name}</h3>
                <p className="text-sm text-primestone-600 mb-4">{sub.location}</p>
                <p className="text-neutral-600 mb-6">{sub.description}</p>
                <ul className="space-y-2">
                  {sub.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-primestone-600 mr-2">•</span>
                      <span className="text-sm text-neutral-600">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Major Contracts */}
      <section className="py-20 bg-gradient-to-b from-primestone-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900 mb-4">
              Major Contracts & Operations
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Our contract momentum creates sustained long-term value
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {contracts.map((contract, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <contract.icon className="w-8 h-8 text-primestone-600" />
                  <span className="text-2xl font-bold text-primestone-600">{contract.value}</span>
                </div>
                <h3 className="text-xl font-semibold mb-1 text-primestone-900">{contract.region}</h3>
                <p className="text-sm text-primestone-600 mb-3">{contract.partner}</p>
                <p className="text-neutral-600 text-sm">{contract.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shareholder Value */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900 mb-6">
                Creating Sustainable Shareholder Value
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <HiOutlineShieldCheck className="w-6 h-6 text-primestone-600 mt-1 mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg text-primestone-900">ASX300 Listing</h3>
                    <p className="text-neutral-600">Index fund exposure with institutional-grade governance and reporting standards.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <HiOutlineChartBar className="w-6 h-6 text-primestone-600 mt-1 mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg text-primestone-900">Dividend Policy</h3>
                    <p className="text-neutral-600">Targeting 30-40% payout ratio, delivering consistent returns to shareholders.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <HiOutlineTrendingUp className="w-6 h-6 text-primestone-600 mt-1 mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg text-primestone-900">Gold Price Exposure</h3>
                    <p className="text-neutral-600">Direct upside through major gold clients, creating leverage to commodity prices.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primestone-50 to-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-primestone-900 mb-4">Investment Highlights</h3>
              <ul className="space-y-4">
                <li className="flex items-center text-neutral-600">
                  <span className="w-2 h-2 bg-primestone-600 rounded-full mr-3"></span>
                  Strong trading history with proven track record
                </li>
                <li className="flex items-center text-neutral-600">
                  <span className="w-2 h-2 bg-primestone-600 rounded-full mr-3"></span>
                  Disciplined dividend policy targeting 30-40% payout
                </li>
                <li className="flex items-center text-neutral-600">
                  <span className="w-2 h-2 bg-primestone-600 rounded-full mr-3"></span>
                  Contract momentum filling revenue gaps
                </li>
                <li className="flex items-center text-neutral-600">
                  <span className="w-2 h-2 bg-primestone-600 rounded-full mr-3"></span>
                  Joint Venture performance driving growth
                </li>
                <li className="flex items-center text-neutral-600">
                  <span className="w-2 h-2 bg-primestone-600 rounded-full mr-3"></span>
                  Exposure to gold price upside
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Blue Background */}
      <section className="py-20 bg-gradient-to-r from-primestone-600 to-primestone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-[#FFD700] mb-4">
            Start Your Investment Journey Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of investors already growing their wealth with PrimeStone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/investments" className="bg-white text-primestone-600 px-8 py-4 rounded-lg font-semibold hover:bg-primestone-50 transition-all duration-300">
              Explore Investment Opportunities
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
