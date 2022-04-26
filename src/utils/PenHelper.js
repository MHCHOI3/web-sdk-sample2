import { PenController, PenMessageType, FirebaseApp } from 'pensdk';

const serviceUuid = parseInt('0x19F1');
const characteristicUuidNoti = parseInt('0x2BA1');
const characteristicUuidWrite = parseInt('0x2BA0');

const PEN_SERVICE_UUID_128 = '4f99f138-9d53-5bfa-9e50-b147491afe68';
const PEN_CHARACTERISTICS_NOTIFICATION_UUID_128 =
    '64cd86b1-2256-5aeb-9f04-2caf6c60ae57';
const PEN_CHARACTERISTICS_WRITE_UUID_128 =
    '8bc8cc7d-88ca-56b0-af9a-9bf514d0d61a';

class PenHelper {
    constructor() {
        this.pens = []; // PenController Array
        this.dotCallback = null;
        this.pageCallback = null;
        this.messageCallback = null;
        this.d = { section: 0, owner: 0, note: 0, page: 0 };
        this.dotStorage = {};
        this.mac = '';
        this.dotArray = [];
    }

    isConnected = () => {
        return this.writecharacteristic ? true : false;
    };

    // MARK: Dot Event Callback
    handleDot = (controller, args) => {
        let mac = controller.info.MacAddress;
        this.mac = mac;
        let dot = args;
        // console.log(args) // 기존에 args.Dot 이었는데  -> 수정
        /**
         * Dot type 재정의
         * 0(Down), 1(Move), 2(Up), 3(Hover)
         */
        if (dot.DotType === 0) {
            // Down
            if (
                this.d.section !== dot.section ||
                this.d.owner !== dot.owner ||
                this.d.note !== dot.note ||
                this.d.page !== dot.page
            ) {
                if (this.pageCallback) this.pageCallback(dot);
                this.d = dot;
                this.dotCallback = null;
            }
        } else if (dot.DotType === 1) {
            // Move
        } else if (dot.DotType === 2) {
            // Up
        }
        if (this.dotCallback) {
            this.dotCallback(mac, dot);
        } else {
            let id =
                dot.section + '_' + dot.owner + '_' + dot.note + '_' + dot.page;
            if (this.dotStorage[id]) {
                this.dotStorage[id].push(dot);
                this.dotArray.push(dot);
            } else {
                this.dotStorage[id] = [];
                this.dotStorage[id].push(dot);
                this.dotArray = [];
                this.dotArray.push(dot);
            }
        }
    };

    // MARK: Pen Event Callback
    handleMessage = (controller, type, args) => {
        let mac = controller.info.MacAddress;
        switch (type) {
            case PenMessageType.PEN_AUTHORIZED:
                console.log('PenHelper PEN_AUTHORIZED');
                controller.RequestAvailableNotes();
                break;
            default:
                break;
        }
        if (this.messageCallback) this.messageCallback(mac, type, args);
    };

    scanPen = async () => {
        if (await this.notSupportBLE()) {
            return;
        }
        let filters = [
            { services: [serviceUuid] },
            { services: [PEN_SERVICE_UUID_128] },
        ];
        let options = {};
        options.filters = filters;
        try {
            const device = await navigator.bluetooth.requestDevice(options);
            console.log('> Name:             ' + device.name);
            console.log('> Id:               ' + device.id);
            console.log('> Connected:        ' + device.gatt.connected);
            this.connectDevice(device);
        } catch (err) {
            console.log('err', err);
        }
    };

    notSupportBLE = async () => {
        if (!navigator.bluetooth) {
            alert('Bluetooth not support');
            return true;
        }
        const isEnableBle = await navigator.bluetooth.getAvailability();
        if (!isEnableBle) {
            alert('Bluetooth not support');
            return true;
        }
        return false;
    };

    connectDevice = async device => {
        if (!device) return;
        console.log('Connect start', device);
        try {
            const service = await device.gatt.connect();
            console.log('service', service);
            this.serviceBinding_16(service, device);
            this.serviceBinding_128(service, device);
        } catch (err) {
            console.log('err conect', err);
        }
    };

    serviceBinding_16 = async (service, device) => {
        try {
            const service_16 = await service.getPrimaryService(serviceUuid);
            console.log('service_16', service_16);
            const characteristicNoti = await service_16.getCharacteristic(
                characteristicUuidNoti
            );
            const characteristicWrite = await service_16.getCharacteristic(
                characteristicUuidWrite
            );
            this.characteristicBinding(
                characteristicNoti,
                characteristicWrite,
                device
            );
        } catch (err) {
            console.log('not support service uuid', err);
        }
    };

    serviceBinding_128 = async (service, device) => {
        try {
            const service_128 = await service.getPrimaryService(
                PEN_SERVICE_UUID_128
            );
            console.log('service_128', service_128);
            const characteristicNoti = await service_128.getCharacteristic(
                PEN_CHARACTERISTICS_NOTIFICATION_UUID_128
            );
            const characteristicWrite = await service_128.getCharacteristic(
                PEN_CHARACTERISTICS_WRITE_UUID_128
            );
            this.characteristicBinding(
                characteristicNoti,
                characteristicWrite,
                device
            );
        } catch (err) {
            console.log('not support service uuid', err);
        }
    };

    characteristicBinding = (read, write, device) => {
        let controller = new PenController();
        controller.device = device;
        // Read Set
        read.startNotifications();
        read.addEventListener('characteristicvaluechanged', event => {
            let value = event.target.value;
            let a = [];
            for (let i = 0; i < value.byteLength; i++) {
                a.push(value.getUint8(i));
            }
            controller.putData(a);
        });
        controller.OnConnected();

        // Write Set
        controller.addWrite(data => {
            write
                .writeValue(data)
                .then(() => {
                    console.log(
                        'write success CMD: ',
                        '0x' + data[1].toString(16),
                        data[1]
                    );
                })
                .catch(err => console.log('write Error', err));
        });
        controller.SetHoverEnable(true);

        // Call back Event Set
        controller.addCallback(this.handleDot, this.handleMessage);
        // device Status Set
        device.addEventListener('gattserverdisconnected', this.onDisconnected);
        this.pens.push(controller);
    };

    // disconnected Callback
    onDisconnected = event => {
        console.log('device disconnect', event);
        console.log('device id', event.currentTarget.id, this.pens);
        this.pens = this.pens.filter(
            p => p.device.id !== event.currentTarget.id
        );
        console.log('pen list', this.pens);
    };

    // disconnect Action
    disconnect = penController => {
        penController.device.gatt.disconnect();
    };
}

const shared = new PenHelper();
export default shared;
