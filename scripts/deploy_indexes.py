import json
import os
import time
from pathlib import Path

import google.auth
from google.auth.transport.requests import AuthorizedSession

project = os.environ.get('FIREBASE_PROJECT_ID', 'bm-food-d04b1')
key_path = os.environ['GOOGLE_APPLICATION_CREDENTIALS']
indexes_path = Path('/home/ubuntu/bm-food-audit/firestore.indexes.json')
with open(key_path, 'r', encoding='utf-8') as fh:
    info = json.load(fh)
credentials, _ = google.auth.load_credentials_from_dict(
    info, scopes=['https://www.googleapis.com/auth/cloud-platform']
)
session = AuthorizedSession(credentials)
base = f'https://firestore.googleapis.com/v1/projects/{project}/databases/(default)'
with indexes_path.open('r', encoding='utf-8') as fh:
    desired = json.load(fh)['indexes']

created = []
existing = []
for spec in desired:
    group = spec['collectionGroup']
    url = f'{base}/collectionGroups/{group}/indexes'
    response = session.get(url)
    if response.status_code >= 400:
        raise RuntimeError(f'Index list failed for {group}: HTTP {response.status_code} {response.text}')
    live = response.json().get('indexes', [])
    wanted = {
        'queryScope': spec['queryScope'],
        'fields': spec['fields'],
    }
    match = next((item for item in live if {
        'queryScope': item.get('queryScope'),
        'fields': item.get('fields', []),
    } == wanted), None)
    if match:
        existing.append({'collectionGroup': group, 'name': match.get('name'), 'state': match.get('state')})
        continue
    payload = {'queryScope': spec['queryScope'], 'fields': spec['fields']}
    create = session.post(url, json=payload)
    create.raise_for_status()
    operation = create.json()
    created.append({'collectionGroup': group, 'operation': operation.get('name')})

print(json.dumps({'projectId': project, 'existing': existing, 'created': created}, indent=2))

for item in created:
    operation_name = item.get('operation')
    if not operation_name:
        continue
    operation_url = f'https://firestore.googleapis.com/v1/{operation_name}'
    for _ in range(90):
        poll = session.get(operation_url)
        poll.raise_for_status()
        state = poll.json()
        if state.get('done'):
            if 'error' in state:
                raise RuntimeError(json.dumps(state['error']))
            break
        time.sleep(2)
    else:
        raise TimeoutError(f'Index operation did not finish: {operation_name}')
    print(json.dumps({'completed': operation_name}))
