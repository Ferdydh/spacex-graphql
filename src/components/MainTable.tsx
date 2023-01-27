import { Form, Radio, Table, Tag } from 'antd'
import { SetStateAction, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { ColumnsType } from 'antd/es/table';
import toShortFormat from '../utilities/date_format';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { useLocalStorage } from '../utilities/useLocalStorage';
import './MainTable.css'
import { hashStr } from '../utilities/hashStr';
import { PresetColors } from 'antd/es/theme/internal';

const GET_LAUNCHES_PAST = gql(`
query past_launch($offset: Int, $limit: Int) {  
  launchesPast(offset: $offset, limit: $limit) {
    mission_name
    rocket {
      rocket_name
      rocket_type
    }
    launch_date_utc
    launch_success
    id
  }
}
`);

const GET_LAUNCHES_UPCOMING = gql(`
query future_launch($offset: Int, $limit: Int) {  
  launchesUpcoming(offset: $offset, limit: $limit) {
    mission_name
    rocket {
      rocket_name
      rocket_type
    }
    launch_date_utc
    launch_success
    id
  }
}
`);

type tableRowType = {
  key: string;
  name: string;
  rocket: {name: string, type: string};
  launch_date: Date;
  launch_success: boolean;
  favorite: boolean;
}



export default function MainTable() {
    const { loading, error, data, fetchMore } = useQuery(GET_LAUNCHES_PAST, {
      variables: { 
        limit: 30,
        offset: 0,
      }});
  
    const [favoriteDictionary, setFavoriteDictionary] = useLocalStorage<Record<string,boolean>>("dictionary", {})
    const [tableRows, setTableRows] = useState<any>([])
    const [isUpcoming, setUpcoming] = useState(true)

    const [rocketNameCollections, setRocketNameCollections] = useState<string[]>([])
    const [rocketTypeCollections, setRocketTypeCollections] = useState<string[]>([])

    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const COLUMNS: ColumnsType<tableRowType> = [
      {
        title: '',
        key: 'favorite',
        width:50,
        render: (record) => (
          <div onClick={() => toggleFavorite(record)}>{record.favorite? <StarFilled style={{ fontSize: '16px', color: '#08c' }} />: <StarOutlined />}</div>
        ),
        sorter: {
          compare: (a, b) => a.favorite - b.favorite,
          multiple: 3,
        },
        showSorterTooltip: false,
        defaultSortOrder: 'descend',
        sortDirections: ['descend','descend'],
      },
      {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          width: 250,
      },
      {
        title: 'Rocket',
        dataIndex: 'rocket',
        key: 'rocket',
        filters: [
          {
            text: 'Rocket Name',
            value: 'Rocket Name',
            children: rocketNameCollections.map((rocketName: string) => Object.assign({text: rocketName, value: rocketName}))
          },
          {
            text: 'Rocket Type',
            value: 'Rocket Type',
            children: rocketTypeCollections.map((rocketType: string) => Object.assign({text: rocketType, value: rocketType}))
          },
        ],
        filterMode: 'tree',
        onFilter: (value, record) => record.rocket.name?.includes(String(value)) || record.rocket.type?.includes(String(value)),
        render: (rocket) => (
          <>
            <Tag color={PresetColors[hashStr(rocket.type) % PresetColors.length]}>
              {rocket.type}
            </Tag>
            <Tag color={PresetColors[hashStr(rocket.name) % PresetColors.length]}>
              {rocket.name}
            </Tag>
          </>
        ),
    },
      {
        title: 'Launch Date',
        dataIndex: 'launch_date',
        key: 'launch_date',
        sorter: {
          compare: (a, b) => a.launch_date - b.launch_date,
          multiple: 2,
        },
        defaultSortOrder: 'descend',
        sortDirections: ['descend','ascend', 'descend'],
        width: 140,
        render: (launch_date) => (
          <div>{toShortFormat(launch_date)}</div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'launch_success',
        key: 'launch_success',
        filters: [
          {
            text: 'Succeed',
            value: true,
          },
          {
            text: 'Failed',
            value: false,
          },
        ],
        onFilter: (value, record) => record.launch_success === value,
        render: (launch_success) => (
          <Tag color={launch_success? 'green': 'red'}>
            {launch_success? 'succeed': 'failed'}
          </Tag>
        ),
      },
    ]
    
    const toggleFavorite = (record: tableRowType) => {
      favoriteDictionary[record.key] = !favoriteDictionary[record.key] 
      setFavoriteDictionary({...favoriteDictionary})
    }


    useEffect(() => {
    // update the favorite dictionary with new entries
    if (!data?.launchesPast) return;

      const res : Record<string, boolean> = {}
      data.launchesPast.reduce((result, launch) => {
        if (!launch?.id || launch?.id === undefined || launch?.id === null || launch.id in favoriteDictionary ) return result
        result[launch.id] = false;
        return result
      }, res)

      setFavoriteDictionary({...favoriteDictionary, ...res})

      // update rocket name list
      setRocketNameCollections(
        [... new Set([...rocketNameCollections, //add the old values
        ...data.launchesPast.map((launch) => launch?.rocket?.rocket_name || '').filter( Boolean )])]
      )
      
      // update rocket type list
      setRocketTypeCollections(
        [... new Set([...rocketTypeCollections, //add the old values
        ...data.launchesPast.map((launch) => launch?.rocket?.rocket_type || '').filter( Boolean )])])

    }, [data])
    
    //  Update the table when favoriting or getting new Data
    useEffect(() => {
      if (!data?.launchesPast) return;

      setTableRows(data.launchesPast?.map((launch) => 
        Object.assign({
          key: launch?.id,
          name: launch?.mission_name, 
          rocket: {name: launch?.rocket?.rocket_name, type: launch?.rocket?.rocket_type},
          launch_date: new Date(launch?.launch_date_utc),
          launch_success: launch?.launch_success? true: false,
          favorite: favoriteDictionary[launch?.id || ''],
      })));
    }, [data, favoriteDictionary])

    // edit DOM for styling purposes
    useEffect(()=> {
      if (!data?.launchesPast) return;

      const thead = document.getElementsByTagName('thead')[0];
      thead.children[0].children[0].replaceChildren('')
      thead.children[0].children[0].className = 'noBefore'
    },[])

    if (loading) return <p>Loading...</p>;

    if (error) return <p>Error : {error.message}</p>;

    if (!data?.launchesPast) return <p>Error : Data not found</p>; 

    const handleChangePage = (page: number, size: number) => {
      setPageIndex(page); 
      setPageSize(size);

      //  TODO: Fetch More
    }

    return (
      <div>
        <div className='flex justify-center m-10'>
          <Form>
            <Form.Item>
              <Radio.Group value={isUpcoming} onChange={(e) => setUpcoming(e.target.value)}>
                <Radio.Button value={true}>Upcoming Launches</Radio.Button>
                <Radio.Button value={false}>Past Launches</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Form>
        </div>
        <Table dataSource={tableRows} 
          columns={COLUMNS}
          pagination={{ 
            defaultPageSize: 10, 
            showSizeChanger: false, 
            position: ['topRight'], 
            current:pageIndex, 
            onChange: handleChangePage
          }}
          className="m-9"
      />
      </div>
    );
  }


